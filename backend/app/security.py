"""비밀번호 해싱(PBKDF2) + JWT 발급/검증.

bcrypt 대신 표준 라이브러리 hashlib.pbkdf2_hmac 사용 — Windows에서 네이티브 빌드
이슈 없이 동작하고 팀플 규모 보안 요구엔 충분함.
"""
import base64
import hashlib
import hmac
import os
import time

import jwt

from . import config

_PBKDF2_ITERATIONS = 240_000
_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60  # 7일


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ITERATIONS)
    return "{}${}".format(
        base64.b64encode(salt).decode(), base64.b64encode(digest).decode()
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_b64, digest_b64 = stored.split("$", 1)
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
    except (ValueError, TypeError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ITERATIONS)
    return hmac.compare_digest(actual, expected)


def create_token(user_id: int, email: str) -> str:
    now = int(time.time())
    payload = {"sub": str(user_id), "email": email, "iat": now, "exp": now + _TOKEN_TTL_SECONDS}
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """유효하면 payload, 만료/위조면 None."""
    try:
        return jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return None
