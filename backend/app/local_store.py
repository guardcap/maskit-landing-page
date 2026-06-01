import json
import base64
import hashlib
import os
from pathlib import Path
from typing import Any, Dict

from cryptography.fernet import Fernet, InvalidToken

LOCAL_DATA_DIR = Path(__file__).resolve().parent / "local_data"
SETTINGS_PATH = LOCAL_DATA_DIR / "user_settings.json"
ENCRYPTED_PREFIX = "enc:v1:"


def _fernet() -> Fernet:
    secret = os.getenv("SECRET_KEY", "maskit-local-dev-secret-change-me")
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest())
    return Fernet(key)


def _encrypt_secret(value: Any) -> Any:
    if not isinstance(value, str) or not value or value.startswith(ENCRYPTED_PREFIX):
        return value
    token = _fernet().encrypt(value.encode("utf-8")).decode("utf-8")
    return f"{ENCRYPTED_PREFIX}{token}"


def _decrypt_secret(value: Any) -> Any:
    if not isinstance(value, str) or not value.startswith(ENCRYPTED_PREFIX):
        return value
    try:
        token = value.removeprefix(ENCRYPTED_PREFIX).encode("utf-8")
        return _fernet().decrypt(token).decode("utf-8")
    except InvalidToken:
        return ""


def _protect_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    protected = dict(settings)
    smtp_config = protected.get("smtp_config")
    if isinstance(smtp_config, dict) and smtp_config.get("smtp_password"):
        smtp_config = dict(smtp_config)
        smtp_config["smtp_password"] = _encrypt_secret(smtp_config["smtp_password"])
        protected["smtp_config"] = smtp_config
    return protected


def _reveal_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    revealed = dict(settings)
    smtp_config = revealed.get("smtp_config")
    if isinstance(smtp_config, dict) and smtp_config.get("smtp_password"):
        smtp_config = dict(smtp_config)
        smtp_config["smtp_password"] = _decrypt_secret(smtp_config["smtp_password"])
        revealed["smtp_config"] = smtp_config
    return revealed


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _write_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    path.chmod(0o600)


def get_user_settings(email: str) -> Dict[str, Any]:
    data = _read_json(SETTINGS_PATH)
    return _reveal_settings(data.get(email, {}))


def update_user_settings(email: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    data = _read_json(SETTINGS_PATH)
    current = data.get(email, {})
    current.update(_protect_settings(settings))
    data[email] = current
    _write_json(SETTINGS_PATH, data)
    return _reveal_settings(current)
