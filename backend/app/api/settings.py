"""
사용자 설정 관리 API
- 이메일 기본 설정
- SMTP 서버 설정
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from pydantic import BaseModel, EmailStr
from pathlib import Path
from dotenv import set_key, load_dotenv
import os

from app.auth.auth_utils import get_current_user, get_current_root_admin
from app.local_store import get_user_settings, update_user_settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
MASKED_STORED_SECRET = "********"
MANAGED_ENV_KEYS = [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "OPENAI_VECTOR_STORE_ID",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_BASE_URL",
    "AZURE_OPENAI_DEPLOYMENT",
    "AZURE_OPENAI_MODEL",
    "AZURE_OPENAI_WEB_SEARCH_TOOL",
    "AZURE_OPENAI_WEB_SEARCH_CONTEXT_SIZE",
    "CLOVA_OCR_URL",
    "CLOVA_OCR_SECRET",
    "NAVER_APP_PASSWORD",
]


# ===== Pydantic 모델 정의 =====

class EmailSettings(BaseModel):
    default_email: EmailStr


class SMTPSettings(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False


class AllSettingsResponse(BaseModel):
    email_settings: Optional[EmailSettings] = None
    smtp_settings: Optional[SMTPSettings] = None


class RuntimeEnvSettings(BaseModel):
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    openai_vector_store_id: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_base_url: Optional[str] = None
    azure_openai_deployment: Optional[str] = None
    azure_openai_model: Optional[str] = None
    azure_openai_web_search_tool: str = "web_search"
    azure_openai_web_search_context_size: str = "low"
    clova_ocr_url: Optional[str] = None
    clova_ocr_secret: Optional[str] = None
    naver_app_password: Optional[str] = None


class RuntimeEnvStatus(BaseModel):
    configured: bool
    env_path: str
    values: dict


def _mask_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}...{value[-4:]}"


def _runtime_env_status() -> RuntimeEnvStatus:
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    values = {key: _mask_secret(os.getenv(key)) for key in MANAGED_ENV_KEYS}
    return RuntimeEnvStatus(
        configured=bool(os.getenv("OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_API_KEY")),
        env_path=str(ENV_PATH),
        values=values,
    )


# ===== API 엔드포인트 =====

@router.get("/all", response_model=AllSettingsResponse)
async def get_all_settings(
    current_user: dict = Depends(get_current_user),
):
    """
    사용자의 모든 설정 조회
    - 이메일 기본 설정
    - SMTP 서버 설정
    """
    try:
        email_settings = None
        smtp_settings = None

        local_settings = get_user_settings(current_user["email"])

        if local_settings.get("email_settings"):
            email_settings = EmailSettings(**local_settings["email_settings"])

        if local_settings.get("smtp_config"):
            smtp_config = dict(local_settings["smtp_config"])
            if smtp_config.get("smtp_password"):
                smtp_config["smtp_password"] = MASKED_STORED_SECRET
            smtp_settings = SMTPSettings(**smtp_config)

        return AllSettingsResponse(
            email_settings=email_settings,
            smtp_settings=smtp_settings
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"설정 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/email")
async def save_email_settings(
    settings: EmailSettings,
    current_user: dict = Depends(get_current_user),
):
    """
    이메일 기본 설정 저장
    """
    try:
        update_user_settings(current_user["email"], {"email_settings": settings.dict()})

        return {
            "success": True,
            "message": "이메일 설정이 저장되었습니다",
            "settings": settings.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이메일 설정 저장 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/smtp")
async def save_smtp_settings(
    settings: SMTPSettings,
    current_user: dict = Depends(get_current_user),
):
    """
    SMTP 서버 설정 저장
    """
    try:
        print(f"\n[Settings] ===== SMTP 설정 저장 시작 =====")
        print(f"[Settings] 사용자 이메일: {current_user['email']}")
        print(f"[Settings] 저장할 설정: {dict((k, v if k != 'smtp_password' else '***') for k, v in settings.dict().items())}")

        smtp_config = settings.dict()
        if smtp_config.get("smtp_password") == MASKED_STORED_SECRET:
            existing = get_user_settings(current_user["email"]).get("smtp_config", {})
            smtp_config["smtp_password"] = existing.get("smtp_password", "")

        update_user_settings(current_user["email"], {"smtp_config": smtp_config})

        print(f"[Settings] ✅ SMTP 설정 저장 완료")
        print(f"[Settings] ===== SMTP 설정 저장 끝 =====\n")

        return {
            "success": True,
            "message": "SMTP 설정이 저장되었습니다",
            "settings": {
                **settings.dict(),
                "smtp_password": "***"  # 비밀번호는 응답에서 숨김
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMTP 설정 저장 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/smtp/test")
async def test_smtp_connection(
    settings: SMTPSettings,
    current_user: dict = Depends(get_current_user),
):
    """
    SMTP 연결 테스트
    - 현재 입력된 설정으로 테스트 (저장하지 않음)
    """
    import smtplib

    try:
        # 제공된 설정 사용
        smtp_config = settings.dict()

        smtp_host = smtp_config.get("smtp_host")
        smtp_port = smtp_config.get("smtp_port", 587)
        smtp_user = smtp_config.get("smtp_user")
        smtp_password = smtp_config.get("smtp_password")
        use_tls = smtp_config.get("smtp_use_tls", True)
        use_ssl = smtp_config.get("smtp_use_ssl", False)

        print(f"[SMTP Test] 연결 테스트 시작...")
        print(f"  Host: {smtp_host}:{smtp_port}")
        print(f"  User: {smtp_user}")
        print(f"  TLS: {use_tls}, SSL: {use_ssl}")
        print(f"  Password 존재: {bool(smtp_password)}")

        # SMTP 서버 연결 테스트
        if use_ssl:
            # SSL 사용 (포트 465)
            print(f"[SMTP Test] SSL 모드로 연결 시도...")
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30) as server:
                print(f"[SMTP Test] SSL 연결 성공")
                server.set_debuglevel(0)  # 디버그 레벨 설정
                if smtp_user and smtp_password:
                    print(f"[SMTP Test] 로그인 시도 중...")
                    server.login(smtp_user, smtp_password)
                    print(f"[SMTP Test] 로그인 성공")
                server.noop()  # 연결 확인
        else:
            # TLS 또는 Plain SMTP (포트 587, 25)
            print(f"[SMTP Test] SMTP 모드로 연결 시도...")
            with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
                print(f"[SMTP Test] SMTP 연결 성공")
                server.set_debuglevel(0)  # 디버그 레벨 설정
                server.ehlo()
                print(f"[SMTP Test] EHLO 성공")
                if use_tls:
                    print(f"[SMTP Test] STARTTLS 시작...")
                    server.starttls()
                    print(f"[SMTP Test] STARTTLS 성공")
                    server.ehlo()
                if smtp_user and smtp_password:
                    print(f"[SMTP Test] 로그인 시도 중...")
                    server.login(smtp_user, smtp_password)
                    print(f"[SMTP Test] 로그인 성공")
                server.noop()  # 연결 확인

        print(f"[SMTP Test] ✅ 연결 성공")

        return {
            "success": True,
            "message": "SMTP 서버 연결에 성공했습니다",
            "details": {
                "host": smtp_host,
                "port": smtp_port,
                "user": smtp_user,
                "tls": use_tls,
                "ssl": use_ssl
            }
        }

    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"인증 실패: 이메일 또는 비밀번호가 올바르지 않습니다. {str(e)}"
        print(f"[SMTP Test] ❌ {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_msg
        )

    except smtplib.SMTPConnectError as e:
        error_msg = f"서버 연결 실패: SMTP 서버 주소를 확인하세요. {str(e)}"
        print(f"[SMTP Test] ❌ {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_msg
        )

    except TimeoutError as e:
        error_msg = f"연결 시간 초과: 서버 주소나 포트를 확인하세요. 방화벽이 차단하고 있을 수 있습니다."
        print(f"[SMTP Test] ❌ {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=error_msg
        )

    except smtplib.SMTPException as e:
        error_msg = f"SMTP 오류: {str(e)}"
        print(f"[SMTP Test] ❌ {error_msg}")
        # SSL/TLS 설정 힌트 추가
        hint = ""
        if smtp_port == 465 and not use_ssl:
            hint = " (포트 465는 SSL을 사용해야 합니다)"
        elif smtp_port == 587 and not use_tls:
            hint = " (포트 587은 TLS를 사용해야 합니다)"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg + hint
        )

    except Exception as e:
        error_msg = f"연결 테스트 실패: {str(e)}"
        error_type = type(e).__name__
        print(f"[SMTP Test] ❌ [{error_type}] {error_msg}")
        import traceback
        traceback.print_exc()

        # 일반적인 오류에 대한 힌트
        hint = ""
        if "timed out" in str(e).lower():
            hint = " 서버 주소나 포트 번호를 확인하세요. 방화벽이나 네트워크 설정을 확인해야 할 수 있습니다."
        elif "connection refused" in str(e).lower():
            hint = " 서버가 해당 포트에서 연결을 거부했습니다. 포트 번호를 확인하세요."

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg + hint
        )


@router.get("/runtime-env", response_model=RuntimeEnvStatus)
async def get_runtime_env_status(
    current_user: dict = Depends(get_current_root_admin),
):
    """
    실제 API 연동 환경변수 설정 상태 조회.
    ROOT 관리자만 접근 가능합니다.
    """
    return _runtime_env_status()


@router.post("/runtime-env", response_model=RuntimeEnvStatus)
async def save_runtime_env_settings(
    settings: RuntimeEnvSettings,
    current_user: dict = Depends(get_current_root_admin),
):
    """
    실제 API 연동에 필요한 키를 서버 .env와 현재 프로세스 환경변수에 저장.
    빈 값은 기존 값을 유지합니다.
    """
    try:
        ENV_PATH.touch(exist_ok=True)
        ENV_PATH.chmod(0o600)

        updates = {
            "OPENAI_API_KEY": settings.openai_api_key,
            "OPENAI_MODEL": settings.openai_model,
            "OPENAI_VECTOR_STORE_ID": settings.openai_vector_store_id,
            "AZURE_OPENAI_API_KEY": settings.azure_openai_api_key,
            "AZURE_OPENAI_ENDPOINT": settings.azure_openai_endpoint,
            "AZURE_OPENAI_BASE_URL": settings.azure_openai_base_url,
            "AZURE_OPENAI_DEPLOYMENT": settings.azure_openai_deployment,
            "AZURE_OPENAI_MODEL": settings.azure_openai_model,
            "AZURE_OPENAI_WEB_SEARCH_TOOL": settings.azure_openai_web_search_tool,
            "AZURE_OPENAI_WEB_SEARCH_CONTEXT_SIZE": settings.azure_openai_web_search_context_size,
            "CLOVA_OCR_URL": settings.clova_ocr_url,
            "CLOVA_OCR_SECRET": settings.clova_ocr_secret,
            "NAVER_APP_PASSWORD": settings.naver_app_password,
        }

        for key, value in updates.items():
            if value is None or value == "":
                continue
            set_key(str(ENV_PATH), key, value)
            os.environ[key] = value

        ENV_PATH.chmod(0o600)
        load_dotenv(dotenv_path=ENV_PATH, override=True)
        return _runtime_env_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"환경변수 저장 중 오류가 발생했습니다: {str(e)}",
        )
