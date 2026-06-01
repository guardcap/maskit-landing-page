const now = Date.now()
const MOCK_SENT_STORAGE_KEY = 'maskit_mock_sent_emails'
const MOCK_MASKED_STORAGE_KEY = 'maskit_mock_masked_emails'
const MOCK_AUDIT_STORAGE_KEY = 'maskit_mock_audit_logs'
const MOCK_SAMPLE_EMAIL_ID = 'mock-sent-001'
const publicAssetUrl = (filename: string) => `${import.meta.env.BASE_URL}${filename}`

const sampleOriginalBody = `안녕하세요, 인사팀 김민지입니다.

아래 신규 입사자에 대한 사내 계정 생성 및 급여 계좌 등록을 요청드립니다.

- 성명: 박서연
- 생년월일: 1999년 3월 12일
- 주민등록번호: 990312-2345678
- 휴대폰 번호: 010-4821-7395
- 개인 이메일: seoyeon.park99@gmail.com
- 사내 이메일: sy.park@company.co.kr
- 주소: 서울특별시 마포구 월드컵북로 45길 17, 302호
- 부서: 보안기술팀
- 직급: 사원
- 입사일: 2026년 6월 10일

급여 계좌 정보는 아래와 같습니다.

- 은행명: 국민은행
- 계좌번호: 123456-01-789012
- 예금주: 박서연

추가로 법인카드 발급 신청도 함께 진행 부탁드립니다.

- 카드 수령 주소: 서울특별시 강남구 테헤란로 152, 14층 총무팀
- 비상 연락처: 010-9182-4567
- 보호자 성명: 박정호
- 보호자 관계: 부

첨부파일에는 신분증 사본과 통장 사본이 포함되어 있으니 외부 공유되지 않도록 주의 부탁드립니다.

감사합니다.
김민지 드림
인사팀 / 02-3456-7788
minji.kim@company.co.kr`

const sampleMaskedBody = `안녕하세요, 인사팀 김민지입니다.

아래 신규 입사자에 대한 사내 계정 생성 및 급여 계좌 등록을 요청드립니다.

- 성명: 박*연
- 생년월일: 1999년 **월 **일
- 주민등록번호: 990312-*******
- 휴대폰 번호: 010-****-7395
- 개인 이메일: se***********@gmail.com
- 사내 이메일: sy*****@company.co.kr
- 주소: 서울특별시 마포구 ****
- 부서: 보안기술팀
- 직급: 사원
- 입사일: 2026년 6월 10일

급여 계좌 정보는 아래와 같습니다.

- 은행명: 국민은행
- 계좌번호: 123456-**-******
- 예금주: 박*연

추가로 법인카드 발급 신청도 함께 진행 부탁드립니다.

- 카드 수령 주소: 서울특별시 강남구 ****
- 비상 연락처: 010-****-4567
- 보호자 성명: 박*호
- 보호자 관계: 부

첨부파일에는 신분증 사본과 통장 사본이 포함되어 있으니 외부 공유되지 않도록 주의 부탁드립니다.

감사합니다.
김민지 드림
인사팀 / 02-3456-7788
minji.kim@company.co.kr`

export const mockUnstructuredAttachment = {
  filename: '예제비정형.png',
  size: 200822,
  content_type: 'image/png',
  public_url: publicAssetUrl('예제비정형.png'),
}

export const mockMaskedUnstructuredAttachment = {
  filename: 'masked_예제비정형.png',
  size: 1206990,
  content_type: 'image/png',
  public_url: publicAssetUrl('masked_예제비정형.png'),
}

export const isMockMode = () => localStorage.getItem('maskit_mock_mode') === 'true'

export const mockReceivedEmails: any[] = []

export const mockSentEmails = [
  {
    _id: MOCK_SAMPLE_EMAIL_ID,
    email_id: MOCK_SAMPLE_EMAIL_ID,
    from_email: 'free.demo@example.com',
    to_email: 'it-admin@company.co.kr',
    to_emails: ['it-admin@company.co.kr', 'payroll@company.co.kr'],
    subject: '신규 입사자 계정 생성 및 급여 등록 요청',
    original_body: sampleOriginalBody,
    body: sampleOriginalBody,
    created_at: new Date(now - 1000 * 60 * 50).toISOString(),
    attachments: [mockUnstructuredAttachment],
    attachments_summary: [mockUnstructuredAttachment],
    status: 'sent',
  },
]

export const mockMaskedEmails = {
  'mock-sent-001': {
    email_id: MOCK_SAMPLE_EMAIL_ID,
    from_email: 'free.demo@example.com',
    to_emails: ['it-admin@company.co.kr', 'payroll@company.co.kr'],
    subject: '신규 입사자 계정 생성 및 급여 등록 요청',
    masked_body: sampleMaskedBody,
    masked_attachments: [mockMaskedUnstructuredAttachment],
    pii_masked_count: 11,
    created_at: new Date(now - 1000 * 60 * 48).toISOString(),
    masking_decisions: {
      sender_name: {
        pii_id: 'sender_name',
        type: 'PERSON',
        value: '김민지',
        should_mask: false,
        masking_method: 'none',
        masked_value: '김민지',
        reason: '사내 업무 요청의 송신자 서명 이름은 수신자가 요청 주체를 확인하고 회신하는 데 필요한 업무 정보입니다. AOAI는 고위험 식별자가 아니며 sender_signature 역할이므로 원문 유지가 적절하다고 판단했습니다.',
        reasoning: '사내 업무 요청의 송신자 서명 이름은 수신자가 요청 주체를 확인하고 회신하는 데 필요한 업무 정보입니다. AOAI는 고위험 식별자가 아니며 sender_signature 역할이므로 원문 유지가 적절하다고 판단했습니다.',
        cited_guidelines: ['업무 수행 목적 내 최소 필요 정보'],
        guideline_matched: true,
        confidence: 0.88,
        risk_level: 'low' as const,
      },
      employee_name: {
        pii_id: 'employee_name',
        type: 'PERSON',
        value: '박서연',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '박*연',
        reason: '신규 입사자 이름은 주민등록번호, 급여 계좌, 연락처, 주소와 함께 제시되어 개인 식별성이 높습니다. AOAI는 사내 처리에 필요한 최소 식별 정보만 남기고 이름은 부분 마스킹하는 것이 적절하다고 판단했습니다.',
        reasoning: '신규 입사자 이름은 주민등록번호, 급여 계좌, 연락처, 주소와 함께 제시되어 개인 식별성이 높습니다. AOAI는 사내 처리에 필요한 최소 식별 정보만 남기고 이름은 부분 마스킹하는 것이 적절하다고 판단했습니다.',
        cited_guidelines: ['개인정보 최소 공개 원칙'],
        guideline_matched: true,
        confidence: 0.94,
        risk_level: 'medium' as const,
      },
      birth_date: {
        pii_id: 'birth_date',
        type: 'DATE_OF_BIRTH',
        value: '1999년 3월 12일',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '1999년 **월 **일',
        reason: '생년월일은 주민등록번호와 함께 제공되어 동일인을 특정할 수 있는 식별 정보입니다. AOAI는 계정 생성과 급여 등록 목적상 전체 월일 노출이 필요하지 않다고 보고 월일을 마스킹 대상으로 판단했습니다.',
        reasoning: '생년월일은 주민등록번호와 함께 제공되어 동일인을 특정할 수 있는 식별 정보입니다. AOAI는 계정 생성과 급여 등록 목적상 전체 월일 노출이 필요하지 않다고 보고 월일을 마스킹 대상으로 판단했습니다.',
        cited_guidelines: ['개인정보 최소 공개 원칙'],
        guideline_matched: true,
        confidence: 0.9,
        risk_level: 'medium' as const,
      },
      resident_registration_number: {
        pii_id: 'resident_registration_number',
        type: 'RRN',
        value: '990312-2345678',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '990312-*******',
        reason: '주민등록번호는 고유식별정보이며 급여 등록 메일에 포함되더라도 노출 위험이 큽니다. AOAI는 업무 처리 여부와 관계없이 뒷자리를 보호해야 하는 고위험 정보로 판단했습니다.',
        reasoning: '주민등록번호는 고유식별정보이며 급여 등록 메일에 포함되더라도 노출 위험이 큽니다. AOAI는 업무 처리 여부와 관계없이 뒷자리를 보호해야 하는 고위험 정보로 판단했습니다.',
        cited_guidelines: ['고유식별정보 처리 제한'],
        guideline_matched: true,
        confidence: 0.99,
        risk_level: 'high' as const,
      },
      mobile_phone: {
        pii_id: 'mobile_phone',
        type: 'PHONE_NUMBER',
        value: '010-4821-7395',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '010-****-7395',
        reason: '신규 입사자의 개인 휴대폰 번호는 직접 연락 가능한 개인 연락처입니다. AOAI는 사내 업무 요청 문맥에서도 전체 번호 노출은 과도하다고 보고 중간 번호 마스킹이 필요하다고 판단했습니다.',
        reasoning: '신규 입사자의 개인 휴대폰 번호는 직접 연락 가능한 개인 연락처입니다. AOAI는 사내 업무 요청 문맥에서도 전체 번호 노출은 과도하다고 보고 중간 번호 마스킹이 필요하다고 판단했습니다.',
        cited_guidelines: ['연락처 보호 기준'],
        guideline_matched: true,
        confidence: 0.97,
        risk_level: 'high' as const,
      },
      personal_email: {
        pii_id: 'personal_email',
        type: 'EMAIL_ADDRESS',
        value: 'seoyeon.park99@gmail.com',
        should_mask: true,
        masking_method: 'partial',
        masked_value: 'se***********@gmail.com',
        reason: '개인 이메일은 업무 계정과 별개인 사적 연락처입니다. AOAI는 계정 생성에 참고될 수 있더라도 전체 주소 노출은 불필요하므로 계정명 일부를 보호하는 것이 적절하다고 판단했습니다.',
        reasoning: '개인 이메일은 업무 계정과 별개인 사적 연락처입니다. AOAI는 계정 생성에 참고될 수 있더라도 전체 주소 노출은 불필요하므로 계정명 일부를 보호하는 것이 적절하다고 판단했습니다.',
        cited_guidelines: ['연락처 보호 기준'],
        guideline_matched: true,
        confidence: 0.96,
        risk_level: 'high' as const,
      },
      corporate_email: {
        pii_id: 'corporate_email',
        type: 'EMAIL_ADDRESS',
        value: 'sy.park@company.co.kr',
        should_mask: true,
        masking_method: 'partial',
        masked_value: 'sy*****@company.co.kr',
        reason: '사내 이메일은 신규 입사자 개인에게 배정되는 계정 식별자입니다. AOAI는 도메인은 업무상 의미가 있으나 계정명 전체는 개인 식별 가능성이 있어 일부 마스킹이 적절하다고 판단했습니다.',
        reasoning: '사내 이메일은 신규 입사자 개인에게 배정되는 계정 식별자입니다. AOAI는 도메인은 업무상 의미가 있으나 계정명 전체는 개인 식별 가능성이 있어 일부 마스킹이 적절하다고 판단했습니다.',
        cited_guidelines: ['개인정보 최소 공개 원칙'],
        guideline_matched: true,
        confidence: 0.89,
        risk_level: 'medium' as const,
      },
      home_address: {
        pii_id: 'home_address',
        type: 'ADDRESS',
        value: '서울특별시 마포구 월드컵북로 45길 17, 302호',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '서울특별시 마포구 ****',
        reason: '자택 주소는 거주지를 특정할 수 있는 위치 정보입니다. AOAI는 입사와 급여 처리 문맥에서도 상세 주소 전체 노출은 필요 최소 범위를 넘는다고 보고 구 단위 이하 상세 주소를 마스킹해야 한다고 판단했습니다.',
        reasoning: '자택 주소는 거주지를 특정할 수 있는 위치 정보입니다. AOAI는 입사와 급여 처리 문맥에서도 상세 주소 전체 노출은 필요 최소 범위를 넘는다고 보고 구 단위 이하 상세 주소를 마스킹해야 한다고 판단했습니다.',
        cited_guidelines: ['주소 정보 보호 기준'],
        guideline_matched: true,
        confidence: 0.97,
        risk_level: 'high' as const,
      },
      bank_account: {
        pii_id: 'bank_account',
        type: 'BANK_ACCOUNT',
        value: '123456-01-789012',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '123456-**-******',
        reason: '급여 계좌번호는 금융정보로 오남용 위험이 높습니다. AOAI는 급여 등록 업무상 은행명과 예금주 확인은 가능하더라도 계좌 상세번호는 부분 마스킹해야 한다고 판단했습니다.',
        reasoning: '급여 계좌번호는 금융정보로 오남용 위험이 높습니다. AOAI는 급여 등록 업무상 은행명과 예금주 확인은 가능하더라도 계좌 상세번호는 부분 마스킹해야 한다고 판단했습니다.',
        cited_guidelines: ['금융정보 보호 기준'],
        guideline_matched: true,
        confidence: 0.98,
        risk_level: 'high' as const,
      },
      card_delivery_address: {
        pii_id: 'card_delivery_address',
        type: 'ADDRESS',
        value: '서울특별시 강남구 테헤란로 152, 14층 총무팀',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '서울특별시 강남구 ****',
        reason: '카드 수령 주소는 법인카드 전달 장소와 조직 내부 위치를 특정합니다. AOAI는 업무 처리에 지역 단위 정보만 남기고 상세 층과 팀 위치는 보호하는 것이 적절하다고 판단했습니다.',
        reasoning: '카드 수령 주소는 법인카드 전달 장소와 조직 내부 위치를 특정합니다. AOAI는 업무 처리에 지역 단위 정보만 남기고 상세 층과 팀 위치는 보호하는 것이 적절하다고 판단했습니다.',
        cited_guidelines: ['주소 정보 보호 기준'],
        guideline_matched: true,
        confidence: 0.92,
        risk_level: 'medium' as const,
      },
      emergency_phone: {
        pii_id: 'emergency_phone',
        type: 'PHONE_NUMBER',
        value: '010-9182-4567',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '010-****-4567',
        reason: '비상 연락처는 제3자의 직접 연락 가능한 개인정보입니다. AOAI는 신규 입사자 본인의 업무 처리 정보가 아니므로 중간 번호를 마스킹해 제3자 노출을 줄여야 한다고 판단했습니다.',
        reasoning: '비상 연락처는 제3자의 직접 연락 가능한 개인정보입니다. AOAI는 신규 입사자 본인의 업무 처리 정보가 아니므로 중간 번호를 마스킹해 제3자 노출을 줄여야 한다고 판단했습니다.',
        cited_guidelines: ['연락처 보호 기준'],
        guideline_matched: true,
        confidence: 0.97,
        risk_level: 'high' as const,
      },
      guardian_name: {
        pii_id: 'guardian_name',
        type: 'PERSON',
        value: '박정호',
        should_mask: true,
        masking_method: 'partial',
        masked_value: '박*호',
        reason: '보호자 성명은 입사자 외 제3자의 식별 정보입니다. AOAI는 보호자 관계와 결합될 경우 제3자를 특정할 수 있어 부분 마스킹이 필요하다고 판단했습니다.',
        reasoning: '보호자 성명은 입사자 외 제3자의 식별 정보입니다. AOAI는 보호자 관계와 결합될 경우 제3자를 특정할 수 있어 부분 마스킹이 필요하다고 판단했습니다.',
        cited_guidelines: ['제3자 개인정보 보호 기준'],
        guideline_matched: true,
        confidence: 0.93,
        risk_level: 'medium' as const,
      },
      office_phone: {
        pii_id: 'office_phone',
        type: 'PHONE_NUMBER',
        value: '02-3456-7788',
        should_mask: false,
        masking_method: 'none',
        masked_value: '02-3456-7788',
        reason: '사내 업무 요청의 송신자 서명 전화번호는 수신자가 요청 내용을 확인하거나 회신할 때 필요한 업무 연락처입니다. AOAI는 고위험 식별자가 아니며 sender_signature 역할이므로 원문 유지가 적절하다고 판단했습니다.',
        reasoning: '사내 업무 요청의 송신자 서명 전화번호는 수신자가 요청 내용을 확인하거나 회신할 때 필요한 업무 연락처입니다. AOAI는 고위험 식별자가 아니며 sender_signature 역할이므로 원문 유지가 적절하다고 판단했습니다.',
        cited_guidelines: ['업무 수행 목적 내 최소 필요 정보'],
        guideline_matched: true,
        confidence: 0.88,
        risk_level: 'low' as const,
      },
      sender_email: {
        pii_id: 'sender_email',
        type: 'EMAIL_ADDRESS',
        value: 'minji.kim@company.co.kr',
        should_mask: false,
        masking_method: 'none',
        masked_value: 'minji.kim@company.co.kr',
        reason: '사내 업무 요청의 송신자 서명 업무 이메일은 수신자의 신원 확인과 회신에 필요한 업무 정보입니다. AOAI는 개인 연락처가 아닌 업무 연락처이며 sender_signature 역할이므로 원문 유지가 적절하다고 판단했습니다.',
        reasoning: '사내 업무 요청의 송신자 서명 업무 이메일은 수신자의 신원 확인과 회신에 필요한 업무 정보입니다. AOAI는 개인 연락처가 아닌 업무 연락처이며 sender_signature 역할이므로 원문 유지가 적절하다고 판단했습니다.',
        cited_guidelines: ['업무 수행 목적 내 최소 필요 정보'],
        guideline_matched: true,
        confidence: 0.88,
        risk_level: 'low' as const,
      },
    },
  },
}

export const mockAuditLogs = [
  {
    _id: 'mock-log-001',
    timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
    event_type: 'masking_decision',
    severity: 'info',
    user_email: 'free.demo@example.com',
    user_role: 'user',
    action: '신규 입사자 계정 생성 및 급여 등록 요청 메일에서 개인정보 14개 분석, 11개 마스킹 권장',
    resource_type: 'email',
    resource_id: MOCK_SAMPLE_EMAIL_ID,
    details: {
      pii_count: 14,
      masked_count: 11,
      mode: 'mock',
      protected_types: ['이름', '생년월일', '주민등록번호', '연락처', '이메일', '주소', '계좌번호'],
      preserved_sender_signature: ['김민지', '02-3456-7788', 'minji.kim@company.co.kr'],
      masked_attachment: 'masked_예제비정형.png',
    },
    success: true,
  },
]

export function findMockReceivedEmail(emailId: string) {
  return mockReceivedEmails.find((email) => email._id === emailId)
}

function readStoredList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error(`mock storage read failed: ${key}`, error)
    return []
  }
}

function writeStoredList<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items))
}

function readStoredMap<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.error(`mock storage map read failed: ${key}`, error)
    return {}
  }
}

function writeStoredMap<T>(key: string, items: Record<string, T>) {
  localStorage.setItem(key, JSON.stringify(items))
}

function attachmentSummary(attachments: any[] = []) {
  return attachments.map((attachment) => ({
    filename: attachment instanceof File ? attachment.name : attachment.filename || attachment.name || 'attachment',
    size: attachment instanceof File ? attachment.size : attachment.size || 0,
    content_type: attachment instanceof File ? attachment.type : attachment.content_type || attachment.type || 'application/octet-stream',
    public_url: attachment instanceof File ? undefined : attachment.public_url,
  }))
}

function normalizeMaskingDecisions(decisions: Record<string, any> = {}) {
  return Object.fromEntries(
    Object.entries(decisions).map(([key, decision]) => [
      key,
      {
        pii_id: decision.pii_id || key,
        type: decision.type || 'UNKNOWN',
        value: decision.value || '',
        should_mask: Boolean(decision.should_mask),
        masking_method: decision.masking_method || (decision.should_mask ? 'partial' : 'none'),
        masked_value: decision.masked_value || (decision.should_mask ? '***' : decision.value || ''),
        reason: decision.reason || '무료 체험 mock 판단입니다.',
        reasoning: decision.reasoning || '실제 관리자 API 설정 시 외부 API와 정책 검색 결과로 판단합니다.',
        cited_guidelines: decision.cited_guidelines || ['무료 체험 샘플 정책'],
        guideline_matched: decision.guideline_matched ?? true,
        confidence: decision.confidence ?? 0.9,
        risk_level: decision.risk_level || (decision.should_mask ? 'medium' : 'low'),
      },
    ]),
  )
}

export function getMockSentEmails() {
  return [...mockSentEmails].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function getMockAuditLogs() {
  return [...mockAuditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function saveMockProcessedEmail(input: {
  emailId?: string
  from: string
  to: string[]
  subject: string
  originalBody: string
  maskedBody?: string
  attachments?: any[]
  maskingDecisions?: Record<string, any>
  actorEmail?: string
  actorRole?: string
}) {
  const emailId = input.emailId || `mock-sent-${Date.now()}`
  const createdAt = new Date().toISOString()
  const attachments = attachmentSummary(input.attachments)
  const piiMaskedCount = Object.values(input.maskingDecisions || {}).filter((decision: any) => decision.should_mask).length

  const sentEmail = {
    _id: emailId,
    email_id: emailId,
    from_email: input.from,
    to_email: input.to[0] || '',
    to_emails: input.to,
    subject: input.subject,
    original_body: input.originalBody,
    body: input.originalBody,
    created_at: createdAt,
    attachments,
    attachments_summary: attachments,
    status: 'sent',
    processed_by: input.actorEmail || input.from,
  }

  const storedSent = readStoredList<any>(MOCK_SENT_STORAGE_KEY).filter(
    (email) => email.email_id !== emailId && email._id !== emailId,
  )
  writeStoredList(MOCK_SENT_STORAGE_KEY, [sentEmail, ...storedSent])

  if (input.maskedBody || input.maskingDecisions) {
    const storedMasked = readStoredMap<any>(MOCK_MASKED_STORAGE_KEY)
    storedMasked[emailId] = {
      email_id: emailId,
      from_email: input.from,
      to_emails: input.to,
      subject: input.subject,
      masked_body: input.maskedBody || input.originalBody,
      masked_attachments: attachments.map((attachment) => {
        const isMockUnstructured = attachment.filename === mockUnstructuredAttachment.filename
        return isMockUnstructured
          ? mockMaskedUnstructuredAttachment
          : {
              ...attachment,
              filename: attachment.filename.replace(/(\.[^.]+)?$/, '_masked$1'),
            }
      }),
      masking_decisions: normalizeMaskingDecisions(input.maskingDecisions),
      pii_masked_count: piiMaskedCount,
      created_at: createdAt,
    }
    writeStoredMap(MOCK_MASKED_STORAGE_KEY, storedMasked)
  }

  const storedLogs = readStoredList<any>(MOCK_AUDIT_STORAGE_KEY)
  writeStoredList(MOCK_AUDIT_STORAGE_KEY, [
    {
      _id: `mock-log-${Date.now()}`,
      timestamp: createdAt,
      event_type: 'email_send',
      severity: 'info',
      user_email: input.actorEmail || input.from,
      user_role: input.actorRole || 'user',
      action: `${input.subject} mock 전송 및 마스킹 처리`,
      resource_type: 'email',
      resource_id: emailId,
      details: {
        mode: 'mock',
        smtp_used: false,
        pii_masked_count: piiMaskedCount,
        visible_in_free_demo: true,
      },
      success: true,
    },
    ...storedLogs,
  ])

  return sentEmail
}

export function findMockSentEmail(emailId: string) {
  return getMockSentEmails().find((email) => email._id === emailId || email.email_id === emailId)
}

export function findMockMaskedEmail(emailId: string) {
  return mockMaskedEmails[emailId as keyof typeof mockMaskedEmails]
}
