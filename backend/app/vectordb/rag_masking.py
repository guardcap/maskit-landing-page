"""
RAG/AOAI 기반 마스킹 결정 모듈
- 내부 가이드라인과 Azure OpenAI web search를 함께 사용
- 실제 PII 값은 외부 검색 질의에 포함하지 않음
"""

from typing import List, Dict, Any, Optional, Tuple
import json
from openai import OpenAI
import os
import re
from dotenv import load_dotenv

load_dotenv()

openai_client = None
azure_openai_client = None
azure_openai_config: Optional[Tuple[str, str]] = None


def get_openai_client():
    global openai_client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    if openai_client is None:
        openai_client = OpenAI(api_key=api_key)
    return openai_client


def _azure_base_url() -> Optional[str]:
    base_url = os.getenv("AZURE_OPENAI_BASE_URL")
    if base_url:
        return base_url.rstrip("/") + "/"

    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    if not endpoint:
        return None
    return endpoint.rstrip("/") + "/openai/v1/"


def get_azure_openai_client():
    global azure_openai_client, azure_openai_config

    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    base_url = _azure_base_url()
    if not api_key or not base_url:
        return None

    config = (api_key, base_url)
    if azure_openai_client is None or azure_openai_config != config:
        azure_openai_client = OpenAI(api_key=api_key, base_url=base_url)
        azure_openai_config = config
    return azure_openai_client


# PII 타입별 한글명 매핑
PII_TYPE_NAMES = {
    'email': '이메일',
    'phone': '전화번호',
    'jumin': '주민등록번호',
    'resident_id': '주민등록번호',
    'account': '계좌번호',
    'bank_account': '계좌번호',
    'passport': '여권번호',
    'driver_license': '운전면허번호',
    'name': '이름',
    'person': '이름',
    'address': '주소',
    'company': '회사명',
    'organization': '조직명',
    'card_number': '카드번호'
}

ALLOWED_CONTEXT_KEYS = {
    "sender_type",
    "receiver_type",
    "purpose",
    "regulations",
    "has_consent",
    "business_context",
    "email_purpose",
    "channel",
}

HIGH_RISK_TYPES = {
    "jumin",
    "resident_id",
    "account",
    "bank_account",
    "card_number",
    "passport",
    "driver_license",
}

CONTACT_TYPES = {"email", "phone"}
PERSON_TYPES = {"name", "person"}
ORG_TYPES = {"company", "organization"}


def _as_text_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    return [str(value)]


def _privacy_safe_text(value: Any, max_length: int = 80) -> str:
    """
    상황 설명에서 원문 식별자가 검색 질의로 흘러가지 않도록 거친 패턴을 제거합니다.
    """
    text = " ".join(_as_text_list(value))
    text = re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", "[email]", text)
    text = re.sub(r"\b\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}\b", "[phone]", text)
    text = re.sub(r"\b\d{6}[-\s]?[1-4]\d{6}\b", "[resident_id]", text)
    text = re.sub(r"\b\d{2,6}[-\s]?\d{2,6}[-\s]?\d{2,8}\b", "[number]", text)
    text = re.sub(r"((성명|예금주|보호자\s*성명|담당자)\s*[:：]\s*)[가-힣]{2,4}", r"\1[person]", text)
    text = re.sub(r"((주소|카드\s*수령\s*주소)\s*[:：]\s*)[^\n]+", r"\1[address]", text)
    text = re.sub(r"([가-힣]{2,4})\s+드림", "[person] 드림", text)
    text = re.sub(r"[가-힣]{2,4}(?=\s*(님|고객|담당자|대리|과장|차장|부장|대표|학생|교수|환자|근로자|의))", "[person]", text)
    text = re.sub(r"(담당자|고객|직원|학생|환자)\s+[가-힣]{2,4}", r"\1 [person]", text)
    text = re.sub(r"https?://\S+", "[url]", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_length]


def _normalize_pii_type(pii_type: str) -> str:
    value = (pii_type or "").lower()
    aliases = {
        "person": "person",
        "name": "person",
        "email": "email",
        "phone": "phone",
        "jumin": "resident_id",
        "resident_id": "resident_id",
        "account": "bank_account",
        "bank_account": "bank_account",
        "address": "address",
        "location": "address",
        "organization": "organization",
        "company": "organization",
        "card": "card_number",
        "card_number": "card_number",
    }
    return aliases.get(value, value or "pii")


def _placeholder_prefix(pii_type: str) -> str:
    return _normalize_pii_type(pii_type).upper()


def _line_for_value(text: str, value: str) -> Tuple[str, int]:
    if not value:
        return "", -1
    index = text.find(value)
    if index == -1:
        return "", -1
    line_start = text.rfind("\n", 0, index) + 1
    line_end = text.find("\n", index)
    if line_end == -1:
        line_end = len(text)
    return text[line_start:line_end].strip(), index


def _field_label_from_line(line: str, value: str) -> str:
    if not line:
        return ""
    before_value = line.split(value, 1)[0]
    if ":" in before_value:
        return before_value.rsplit(":", 1)[0].strip(" -•\t")
    if "-" in before_value:
        return before_value.rsplit("-", 1)[0].strip(" -•\t")
    return _privacy_safe_text(before_value, 40)


def _section_around(text: str, index: int) -> str:
    if index < 0:
        return "unknown"
    lower_text = text.lower()
    before = text[max(0, index - 260):index]
    after = text[index:index + 160]
    window = before + after

    signature_markers = [pos for pos in [text.find("감사합니다"), text.find(" 드림"), text.find("팀 /")] if pos != -1]
    signature_start = min(signature_markers) if signature_markers else -1
    payroll_markers = [pos for pos in [text.find("급여 계좌 정보"), text.find("계좌 정보는")] if pos != -1]
    payroll_start = min(payroll_markers) if payroll_markers else text.find("급여 계좌")
    corporate_start = text.find("법인카드")
    onboarding_start = text.find("신규 입사자")
    next_after_payroll = min([pos for pos in [corporate_start, signature_start] if pos != -1] or [len(text)])
    next_after_corporate = signature_start if signature_start != -1 else len(text)

    if signature_start != -1 and index >= signature_start:
        return "email_signature"
    if payroll_start != -1 and payroll_start <= index < next_after_payroll:
        return "payroll_account"
    if corporate_start != -1 and corporate_start <= index < next_after_corporate:
        return "corporate_card_request"
    if onboarding_start != -1 and onboarding_start <= index < next_after_payroll:
        return "employee_onboarding"
    if lower_text.rfind("첨부", 0, index) > lower_text.rfind("\n\n", 0, index):
        return "attachment_notice"
    if any(keyword in window for keyword in ["급여 계좌", "계좌 정보", "은행명", "계좌번호", "예금주"]):
        return "payroll_account"
    if any(keyword in window for keyword in ["법인카드", "카드 수령", "비상 연락처", "보호자"]):
        return "corporate_card_request"
    if any(keyword in window for keyword in ["신규 입사자", "사내 계정", "입사일", "부서", "직급"]):
        return "employee_onboarding"
    return "email_body"


def _infer_business_purpose(email_subject: str, email_body: str, context: Dict[str, Any]) -> List[str]:
    joined = " ".join(_as_text_list(context.get("purpose"))) + " " + email_subject + " " + email_body[:2000]
    candidates = [
        ("onboarding", ["신규 입사", "입사자", "입사일", "사내 계정", "계정 생성"]),
        ("payroll_registration", ["급여", "계좌", "예금주", "은행"]),
        ("corporate_card", ["법인카드", "카드 발급", "카드 수령"]),
        ("internal_hr_request", ["인사팀", "총무팀", "부서", "직급"]),
        ("attachment_handling", ["신분증 사본", "통장 사본", "첨부파일"]),
    ]
    purposes = [label for label, keywords in candidates if any(keyword in joined for keyword in keywords)]
    return purposes or [_purpose_category(context.get("purpose") or email_subject or email_body)]


def _infer_semantic_role(
    pii_type: str,
    value: str,
    line: str,
    field_label: str,
    section: str,
    text: str,
    index: int,
) -> str:
    normalized = _normalize_pii_type(pii_type)
    label = field_label.replace(" ", "")

    if re.fullmatch(r"\d{1,3}", value or "") and normalized in {"organization", "person"}:
        return "false_positive_candidate"
    if value in {"드림", "감사", "인사", "총무"}:
        return "false_positive_candidate"
    if any(keyword in label for keyword in ["보호자", "비상연락처"]):
        return "guardian_or_emergency_contact"
    if any(keyword in label for keyword in ["카드수령주소"]):
        return "delivery_address"
    if any(keyword in label for keyword in ["성명", "예금주"]):
        return "request_subject_identity"
    if any(keyword in label for keyword in ["주민등록번호", "주민번호"]):
        return "legal_identifier"
    if any(keyword in label for keyword in ["휴대폰", "개인이메일", "주소"]):
        return "request_subject_contact"
    if any(keyword in label for keyword in ["사내이메일", "부서", "직급", "입사일"]):
        return "work_provisioning_data"
    if any(keyword in label for keyword in ["은행명", "계좌번호"]):
        return "payroll_account_data"
    if section == "email_signature" or ("안녕하세요" in line and "입니다" in line):
        if normalized in {"person", "email", "phone", "organization"}:
            return "sender_signature"
    if normalized == "organization" and any(keyword in line for keyword in ["팀", "부서", "은행", "직급"]):
        return "business_organization"
    if normalized == "address":
        return "address_component"
    if normalized in {"resident_id", "bank_account", "card_number", "passport", "driver_license"}:
        return "high_risk_identifier"
    return "general_pii"


def _replace_values_with_placeholders(text: str, replacements: List[Tuple[str, str]]) -> str:
    safe_text = text or ""
    for value, placeholder in sorted(replacements, key=lambda item: len(item[0]), reverse=True):
        if value:
            safe_text = safe_text.replace(value, placeholder)
    return safe_text


def prepare_privacy_safe_analysis_context(
    email_body: str,
    email_subject: str,
    detected_pii: List[Dict[str, str]],
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    실제 PII 값은 제거하고 placeholder 기반 문맥과 PII별 업무상 역할을 만듭니다.
    이 결과만 AOAI prompt/search context에 전달합니다.
    """
    safe_context = build_privacy_safe_context(context)
    business_purposes = _infer_business_purpose(email_subject, email_body, context)
    replacements: List[Tuple[str, str]] = []
    pii_contexts: List[Dict[str, Any]] = []
    type_counts: Dict[str, int] = {}

    for idx, pii in enumerate(detected_pii):
        pii_type = pii.get("type", "")
        pii_value = pii.get("value", "")
        normalized = _normalize_pii_type(pii_type)
        type_counts[normalized] = type_counts.get(normalized, 0) + 1
        placeholder = f"<{_placeholder_prefix(pii_type)}_{type_counts[normalized]}>"
        line, index = _line_for_value(email_body, pii_value)
        field_label = _field_label_from_line(line, pii_value)
        section = _section_around(email_body, index)
        semantic_role = _infer_semantic_role(pii_type, pii_value, line, field_label, section, email_body, index)
        safe_line = _replace_values_with_placeholders(line, [(pii_value, placeholder)])

        replacements.append((pii_value, placeholder))
        pii_contexts.append({
            "pii_index": idx,
            "placeholder": placeholder,
            "pii_type": PII_TYPE_NAMES.get((pii_type or "").lower(), pii_type),
            "normalized_type": normalized,
            "semantic_role": semantic_role,
            "field_label": _privacy_safe_text(field_label, 60),
            "section": section,
            "safe_line": _privacy_safe_text(safe_line, 180),
            "is_sender_identity": semantic_role == "sender_signature",
            "is_subject_of_request": semantic_role in {
                "request_subject_identity",
                "request_subject_contact",
                "work_provisioning_data",
                "payroll_account_data",
            },
            "is_likely_false_positive": semantic_role == "false_positive_candidate",
        })

    safe_body = _replace_values_with_placeholders(email_body, replacements)
    safe_subject = _replace_values_with_placeholders(email_subject, replacements)
    safe_body = _privacy_safe_text(safe_body, 3000)

    safe_context.update({
        "email_subject_placeholder": safe_subject[:200],
        "email_body_placeholder": safe_body,
        "business_purpose_inferred": business_purposes,
        "pii_contexts": pii_contexts,
    })
    return safe_context


def _policy_override(pii_context: Dict[str, Any], receiver_type: str) -> Optional[Dict[str, Any]]:
    """
    명확한 업무 맥락/오탐은 LLM 결과보다 우선 적용합니다.
    고위험 식별자는 여기서 해제하지 않습니다.
    """
    role = pii_context.get("semantic_role")
    normalized = pii_context.get("normalized_type")

    if role == "false_positive_candidate":
        return {
            "should_mask": False,
            "masking_method": "none",
            "reason": "비식별 문맥상 개인정보가 아닌 오탐 후보로 판단되어 마스킹하지 않습니다.",
            "legal_basis": "오탐 제외 및 최소 업무 정보 보존",
            "confidence": 0.9,
        }

    if receiver_type == "internal" and role == "sender_signature" and normalized not in HIGH_RISK_TYPES:
        return {
            "should_mask": False,
            "masking_method": "none",
            "reason": "사내 업무 요청에서 송신자 서명 정보는 수신자의 업무상 신원 확인과 회신을 위해 필요한 정보이므로 원문 유지가 적절합니다.",
            "legal_basis": "업무 수행 목적 내 최소 필요 정보",
            "confidence": 0.88,
        }

    if receiver_type == "internal" and role in {"business_organization", "work_provisioning_data"} and normalized == "organization":
        return {
            "should_mask": False,
            "masking_method": "none",
            "reason": "부서명, 팀명, 은행명 등 조직/업무 식별 정보는 단독으로 개인을 직접 식별하는 개인정보가 아니며 해당 업무 처리에 필요합니다.",
            "legal_basis": "조직명 단독 정보 및 업무상 필요 정보",
            "confidence": 0.86,
        }

    return None


def _purpose_category(value: Any) -> str:
    text = " ".join(_as_text_list(value))
    categories = [
        ("계약/거래 문서 전달", ["계약", "견적", "거래", "청구", "정산"]),
        ("고객 문의 대응", ["문의", "상담", "고객응대", "지원"]),
        ("인사/노무 업무", ["인사", "급여", "채용", "퇴직", "근로"]),
        ("세무/회계/감사 대응", ["세무", "회계", "감사", "재무", "신고"]),
        ("보안/사고 대응", ["보안", "사고", "침해", "신고"]),
        ("일반 업무 이메일", []),
    ]
    for label, keywords in categories:
        if any(keyword in text for keyword in keywords):
            return label
    return "일반 업무 이메일"


def build_privacy_safe_context(context: Dict[str, Any]) -> Dict[str, Any]:
    safe_context: Dict[str, Any] = {}
    for key in ALLOWED_CONTEXT_KEYS:
        if key not in context:
            continue
        value = context.get(key)
        if isinstance(value, bool):
            safe_context[key] = value
        elif isinstance(value, list):
            safe_context[key] = [_privacy_safe_text(item) for item in value][:5]
        else:
            safe_context[key] = _privacy_safe_text(value)
    return safe_context


def build_privacy_safe_search_query(
    pii_type_kr: str,
    receiver_type_kr: str,
    safe_context: Dict[str, Any],
    pii_context: Optional[Dict[str, Any]] = None,
) -> str:
    purpose = _purpose_category(safe_context.get("purpose") or safe_context.get("email_purpose"))
    inferred = safe_context.get("business_purpose_inferred")
    if inferred:
        purpose = ", ".join(_as_text_list(inferred)[:3])
    regulations = ", ".join(_as_text_list(safe_context.get("regulations"))) or "개인정보보호법"
    semantic_role = ""
    if pii_context:
        semantic_role = f" {pii_context.get('semantic_role', '')} 역할의"
    return (
        f"{receiver_type_kr} 수신자에게 {purpose} 상황에서{semantic_role} "
        f"{pii_type_kr} 유형 개인정보를 마스킹해야 하는지 판단 기준 {regulations}"
    )


def _extract_json_object(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group())


def _response_citations(response: Any) -> List[str]:
    citations = []
    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            for annotation in getattr(content, "annotations", []) or []:
                url = getattr(annotation, "url", None)
                title = getattr(annotation, "title", None)
                if url:
                    citations.append(f"{title or 'source'}: {url}")
    return citations


def normalize_receiver_type(context: Dict[str, Any]) -> str:
    """
    컨텍스트에서 수신자 타입을 추출하고 정규화

    Returns:
        'external', 'internal', 또는 'unknown'
    """
    receiver_type = context.get('receiver_type', '')
    purposes = context.get('purpose', [])

    # 사외 수신자 키워드
    external_categories = ['협력 업체', '고객사', '정부 기관']
    government_purposes = ['세무 신고', '재무 보고', '감사 대응', '규제 준수']

    # 사내 수신자 키워드
    internal_categories = ['인사팀', '고객지원팀', 'R&D팀', '대외협력팀', '개발팀']

    # 1. purpose 기반 판단
    if isinstance(purposes, list) and purposes:
        if any(cat in purpose for purpose in purposes for cat in external_categories):
            return 'external'
        elif any(gov_purpose in purpose for purpose in purposes for gov_purpose in government_purposes):
            return 'external'
        elif any(dept in purpose for purpose in purposes for dept in internal_categories):
            return 'internal'

    # 2. receiver_type 한글 → 영어 변환
    if receiver_type == '사외':
        return 'external'
    elif receiver_type == '사내':
        return 'internal'
    elif receiver_type in ['external', 'internal']:
        return receiver_type

    return 'unknown'


def build_guideline_context(guides: List[Dict[str, Any]], max_guides: int = 5) -> str:
    """
    검색된 가이드라인을 프롬프트용 텍스트로 구성
    """
    if not guides:
        return "관련 가이드라인을 찾을 수 없습니다."

    guideline_context = "검색된 정책 가이드라인:\n"
    for idx, guide in enumerate(guides[:max_guides], 1):
        content = guide.get('content', '')
        filename = guide.get('filename', '정책 문서')
        # 더 많은 내용 포함 (600자 → 1000자)
        guideline_context += f"\n[가이드라인 {idx}] 출처: {filename}\n{content[:1000]}\n"

    return guideline_context


async def decide_masking_with_rag(
    pii_type: str,
    pii_value: str,
    context: Dict[str, Any],
    guides: List[Dict[str, Any]],
    pii_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Azure OpenAI web_search 기반으로 단일 PII에 대한 마스킹 결정.
    실제 PII 값은 모델 입력과 웹 검색 질의에 포함하지 않습니다.

    Args:
        pii_type: PII 타입 (예: 'email', 'person', 'resident_id')
        pii_value: PII 실제 값
        context: 이메일 전송 컨텍스트 (receiver_type, purpose, regulations 등)
        guides: Vector Store에서 검색된 가이드라인 목록

    Returns:
        {
            "should_mask": bool,
            "masking_method": "full" | "none",
            "legal_basis": str,
            "reason": str,
            "confidence": float,
            "cited_guidelines": List[str]
        }
    """

    receiver_type = normalize_receiver_type(context)
    receiver_type_kr = '사외' if receiver_type == 'external' else '사내' if receiver_type == 'internal' else '알 수 없음'
    pii_type_lower = pii_type.lower()
    pii_type_kr = PII_TYPE_NAMES.get(pii_type_lower, pii_type)
    safe_context = build_privacy_safe_context(context)
    if context.get("email_body_placeholder"):
        safe_context["email_body_placeholder"] = context.get("email_body_placeholder")
    if context.get("email_subject_placeholder"):
        safe_context["email_subject_placeholder"] = context.get("email_subject_placeholder")
    if context.get("business_purpose_inferred"):
        safe_context["business_purpose_inferred"] = context.get("business_purpose_inferred")
    purpose_items = _as_text_list(safe_context.get("purpose") or safe_context.get("email_purpose"))
    if safe_context.get("business_purpose_inferred"):
        purpose_items = _as_text_list(safe_context.get("business_purpose_inferred"))
    regulation_items = _as_text_list(safe_context.get("regulations"))
    purpose_str = ", ".join(purpose_items) if purpose_items else "미지정"
    regulation_str = ", ".join(regulation_items) if regulation_items else "미지정"
    guideline_context = build_guideline_context(guides)
    search_query = build_privacy_safe_search_query(pii_type_kr, receiver_type_kr, safe_context, pii_context)
    web_search_tool = os.getenv("AZURE_OPENAI_WEB_SEARCH_TOOL", "web_search")
    pii_context = pii_context or {}
    placeholder = pii_context.get("placeholder", f"<{_placeholder_prefix(pii_type)}>")
    policy_override = _policy_override(pii_context, receiver_type)

    prompt = f"""
당신은 한국 개인정보보호 및 기업 DLP 정책 검토 전문가입니다.
반드시 Azure OpenAI web search 도구로 최신 법령/가이드/공식 자료를 확인한 뒤 판단하세요.

중요한 보안 규칙:
- 실제 개인정보 값은 제공되지 않았으며, 절대 추정하거나 요구하지 마세요.
- 웹 검색 질의에는 개인정보 원문이 아니라 PII 유형과 업무 상황만 사용하세요.
- 아래의 검색 질의만 개인정보 보호 목적의 안전한 질의로 사용하세요.

안전한 검색 질의:
{search_query}

판단 대상:
- PII placeholder: {placeholder}
- PII 유형: {pii_type_kr} ({pii_type_lower})
- 의미 역할: {pii_context.get("semantic_role", "미분류")}
- 필드/라벨: {pii_context.get("field_label", "미지정")}
- 문서 섹션: {pii_context.get("section", "미지정")}
- 안전한 주변 문장: {pii_context.get("safe_line", "미지정")}
- 송신자 신원 확인 정보 여부: {pii_context.get("is_sender_identity", False)}
- 요청 대상자 업무 처리 정보 여부: {pii_context.get("is_subject_of_request", False)}
- 오탐 후보 여부: {pii_context.get("is_likely_false_positive", False)}
- 수신자 유형: {receiver_type_kr} ({receiver_type})
- 전송 목적: {purpose_str}
- 적용 규정/관점: {regulation_str}
- 동의 여부: {safe_context.get("has_consent", "미지정")}

비식별 이메일 문맥:
- 제목: {safe_context.get("email_subject_placeholder", "미제공")}
- 본문:
{safe_context.get("email_body_placeholder", "미제공")}

내부 정책/RAG 참고자료:
{guideline_context}

판단 기준:
1. "마스킹을 하면 안 되는가"와 "마스킹을 해야 하는가"를 모두 검토하세요.
2. 업무 수행에 원문이 필수인 경우에는 none을 선택할 수 있습니다.
3. 외부 전송, 고유식별정보, 금융정보, 인증정보, 민감정보는 보수적으로 판단하세요.
4. 회사 정책과 최신 공개 자료가 충돌하면 더 엄격한 보호 기준을 우선하세요.
5. 조직명/회사명은 단독 언급이면 보통 개인정보가 아니지만, 개인과 결합되어 식별 가능하면 보호 대상으로 판단하세요.
6. 사내 업무 요청에서 sender_signature 역할의 송신자 이름/업무 이메일/업무 전화번호는 수신자의 신원 확인과 회신을 위해 필요한 경우가 많으므로, 고위험 식별자가 아니면 원문 유지 가능성을 우선 검토하세요.
7. onboarding, payroll_registration, corporate_card 같은 내부 인사/총무 업무에서는 요청 대상자 식별에 필요한 업무 정보와 고위험 정보(주민등록번호, 계좌번호, 개인 연락처/주소)를 구분하세요.
8. false_positive_candidate 또는 조직명/부서명/직급/은행명처럼 단독 업무 정보로 보이는 항목은 마스킹하지 않는 판단을 적극 검토하세요.

JSON만 반환하세요:
{{
  "should_mask": true,
  "masking_method": "full",
  "legal_basis": "근거 법령/가이드/정책",
  "reason": "판단 이유 1-2문장",
  "confidence": 0.0,
  "search_query_used": "{search_query}"
}}
"""

    try:
        client = get_azure_openai_client()
        if client is None:
            raise RuntimeError("AZURE_OPENAI_API_KEY/AZURE_OPENAI_ENDPOINT가 설정되지 않았습니다.")

        llm_response = client.responses.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT", os.getenv("AZURE_OPENAI_MODEL", "gpt-4.1-mini")),
            input=prompt,
            tools=[
                {
                    "type": web_search_tool,
                    "search_context_size": os.getenv("AZURE_OPENAI_WEB_SEARCH_CONTEXT_SIZE", "low"),
                }
            ],
            temperature=0.1,
        )

        output_text = getattr(llm_response, "output_text", "")
        llm_result = _extract_json_object(output_text)

        if policy_override:
            should_mask = policy_override["should_mask"]
            masking_method = policy_override["masking_method"]
            legal_basis = policy_override["legal_basis"]
            reason = policy_override["reason"]
            confidence = float(policy_override["confidence"])
        else:
            should_mask = bool(llm_result.get('should_mask', False))
            masking_method = llm_result.get('masking_method', 'none')
            legal_basis = llm_result.get('legal_basis', '')
            reason = llm_result.get('reason', '')
            confidence = float(llm_result.get('confidence', 0.8))
        citations = _response_citations(llm_response)
        cited_guidelines = citations or ([legal_basis] if legal_basis else [])
        if policy_override:
            cited_guidelines = [legal_basis, *cited_guidelines]

        return {
            "should_mask": should_mask,
            "masking_method": masking_method,
            "legal_basis": legal_basis,
            "reason": reason,
            "confidence": confidence,
            "cited_guidelines": cited_guidelines,
            "reasoning_steps": [
                "1. 실제 PII 값은 AOAI 입력 및 web search 질의에서 제외",
                f"2. 원문 대신 placeholder 사용: {placeholder}",
                f"3. 의미 역할: {pii_context.get('semantic_role', '미분류')} / 섹션: {pii_context.get('section', '미분류')}",
                f"4. 안전 검색 질의: {search_query}",
                f"5. 컨텍스트: {receiver_type_kr} 전송, 목적={purpose_str}",
                f"6. PII 유형: {pii_type_kr}",
                f"7. AOAI web search 기반 판단: {masking_method.upper()}",
                f"8. 정책 보정 적용: {'yes' if policy_override else 'no'}",
                f"9. 법적/정책 근거: {legal_basis}",
                f"10. 판단 이유: {reason}",
            ],
            "search_query_used": search_query,
            "safe_context": safe_context,
            "pii_context": pii_context,
        }

    except Exception as e:
        print(f"❌ AOAI web search 마스킹 판단 실패: {e}")
        if policy_override:
            should_mask = policy_override["should_mask"]
            masking_method = policy_override["masking_method"]
            legal_basis = policy_override["legal_basis"]
            reason = policy_override["reason"]
            confidence = float(policy_override["confidence"])
        else:
            should_mask = receiver_type == 'external'
            masking_method = "full" if should_mask else "none"
            legal_basis = "개인정보보호법 제17조 (개인정보 제3자 제공)"
            reason = f"AOAI web search 판단 실패, 기본 규칙 적용: {receiver_type_kr} 전송"
            confidence = 0.5

        return {
            "should_mask": should_mask,
            "masking_method": masking_method,
            "legal_basis": legal_basis,
            "reason": reason,
            "confidence": confidence,
            "cited_guidelines": [legal_basis],
            "reasoning_steps": [
                "1. 실제 PII 값은 web search 질의에서 제외",
                f"2. 원문 대신 placeholder 사용: {placeholder}",
                f"3. 의미 역할: {pii_context.get('semantic_role', '미분류')}",
                f"4. 안전 검색 질의: {search_query}",
                "5. AOAI 판단 실패, fallback/정책 보정 사용",
                f"6. 정책 보정 적용: {'yes' if policy_override else 'no'}",
                f"7. 수신자: {receiver_type_kr}",
                f"8. 기본 마스킹: {masking_method}",
            ],
            "search_query_used": search_query,
            "safe_context": safe_context,
            "pii_context": pii_context,
        }


async def decide_all_pii_with_rag(
    detected_pii: List[Dict[str, str]],
    context: Dict[str, Any],
    guides: List[Dict[str, Any]],
    progress_callback=None,
    email_body: str = "",
    email_subject: str = "",
) -> Dict[str, Any]:
    """
    모든 PII에 대해 RAG 기반 마스킹 결정

    Args:
        progress_callback: 진행 상황을 전달할 콜백 함수

    Returns:
        {
            "pii_0": {...},
            "pii_1": {...},
            ...
        }
    """
    decisions = {}
    analysis_context = prepare_privacy_safe_analysis_context(
        email_body=email_body,
        email_subject=email_subject,
        detected_pii=detected_pii,
        context=context,
    ) if email_body or email_subject else context
    pii_contexts = analysis_context.get("pii_contexts", [])

    for i, pii in enumerate(detected_pii):
        pii_type = pii.get('type', '')
        pii_value = pii.get('value', '')

        log_msg = f"[RAG] PII #{i+1}/{len(detected_pii)}: type={pii_type}, value=<redacted>"
        print(log_msg)
        if progress_callback:
            progress_callback(log_msg)

        # RAG 기반 판단
        decision = await decide_masking_with_rag(
            pii_type,
            pii_value,
            analysis_context,
            guides,
            pii_context=pii_contexts[i] if i < len(pii_contexts) else None,
        )

        # 마스킹 미리보기 생성
        masked_value = None
        if decision['should_mask']:
            from app.utils.masking_rules import MaskingRules
            try:
                masked_value = MaskingRules.apply_masking(pii_value, pii_type.lower(), 'full')
            except Exception as e:
                print(f"❌ 마스킹 미리보기 실패: {e}")
                masked_value = "***"

        # 결과 저장
        decisions[f"pii_{i}"] = {
            "pii_id": f"pii_{i}",
            "type": pii_type,
            "value": pii_value,
            "should_mask": decision['should_mask'],
            "masking_method": decision['masking_method'],
            "masked_value": masked_value,
            "reason": decision['reason'],
            "reasoning": "\n".join(decision['reasoning_steps']),
            "cited_guidelines": decision['cited_guidelines'],
            "search_query_used": decision.get("search_query_used"),
            "confidence": decision['confidence'],
            "pii_context": decision.get("pii_context"),
            "risk_level": (
                "high" if pii_type.lower() in ['jumin', 'resident_id', 'account', 'bank_account', 'card_number', 'passport', 'driver_license']
                else "medium" if pii_type.lower() in ['person', 'email', 'phone', 'address'] and decision['should_mask']
                else "low"
            )
        }

        print(f"✅ PII #{i} 판단 완료: {decision['masking_method']}, 근거: {decision['legal_basis']}")

    return decisions
