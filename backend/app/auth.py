"""회원가입 / 로그인 / 내 정보 조회 API.

- POST /api/auth/signup        {email, password, nickname} → {token, user}
- POST /api/auth/login         {email, password}           → {token, user}
- POST /api/auth/google        {access_token}              → {token, user}  (구글 OAuth)
- GET  /api/auth/google/config                             → {client_id}
- GET  /api/auth/me            (Authorization: Bearer ...) → {user}
"""
import re
import secrets

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from . import config, db, security

router = APIRouter(prefix="/api/auth", tags=["auth"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignupBody(BaseModel):
    email: str
    password: str
    nickname: str


class LoginBody(BaseModel):
    email: str
    password: str


def _public_user(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"], "nickname": user["nickname"]}


@router.post("/signup")
def signup(body: SignupBody):
    email = body.email.strip().lower()
    nickname = body.nickname.strip()

    if not _EMAIL_RE.match(email):
        raise HTTPException(400, "이메일 형식이 올바르지 않습니다.")
    if len(body.password) < 8:
        raise HTTPException(400, "비밀번호는 8자 이상이어야 합니다.")
    if not nickname:
        raise HTTPException(400, "닉네임을 입력해 주세요.")
    if db.find_user_by_email(email):
        raise HTTPException(409, "이미 가입된 이메일입니다.")

    user = db.create_user(email, security.hash_password(body.password), nickname)
    token = security.create_token(user["id"], user["email"])
    return {"token": token, "user": _public_user(user)}


@router.post("/login")
def login(body: LoginBody):
    email = body.email.strip().lower()
    user = db.find_user_by_email(email)
    if not user or not security.verify_password(body.password, user["password_hash"]):
        # 계정 존재 여부를 구분해서 알려주지 않음 (계정 탐색 방지)
        raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다.")

    token = security.create_token(user["id"], user["email"])
    return {"token": token, "user": _public_user(user)}


class GoogleBody(BaseModel):
    access_token: str


@router.get("/google/config")
def google_config():
    """프론트가 런타임에 클라이언트 ID를 받아가는 엔드포인트 (빌드타임 env 불필요)."""
    return {"client_id": config.GOOGLE_CLIENT_ID}


@router.post("/google")
def google_login(body: GoogleBody):
    """구글 액세스 토큰을 검증하고 우리 서비스 JWT를 발급한다.

    같은 이메일 계정이 없으면 자동 가입 처리(비밀번호는 무작위 — 이메일 로그인 불가,
    구글 로그인으로만 접근 가능).
    """
    try:
        resp = httpx.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            params={"access_token": body.access_token},
            timeout=10,
        )
    except httpx.HTTPError:
        raise HTTPException(502, "구글 인증 서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.")
    if resp.status_code != 200:
        raise HTTPException(401, "구글 로그인에 실패했습니다. 다시 시도해 주세요.")

    info = resp.json()
    # 다른 앱에서 발급된 토큰 재사용 방지 — 우리 클라이언트 ID로 발급된 토큰만 허용
    if config.GOOGLE_CLIENT_ID and info.get("aud") != config.GOOGLE_CLIENT_ID:
        raise HTTPException(401, "이 서비스용으로 발급된 구글 토큰이 아닙니다.")

    email = (info.get("email") or "").strip().lower()
    if not email or str(info.get("email_verified")).lower() != "true":
        raise HTTPException(401, "구글 계정의 이메일을 확인할 수 없습니다.")

    user = db.find_user_by_email(email)
    if not user:
        # 구글 프로필 이름을 닉네임으로 사용 (실패하면 이메일 앞부분)
        nickname = email.split("@")[0]
        try:
            ui = httpx.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {body.access_token}"},
                timeout=10,
            )
            if ui.status_code == 200:
                nickname = (ui.json().get("name") or nickname).strip() or nickname
        except httpx.HTTPError:
            pass
        user = db.create_user(email, security.hash_password(secrets.token_urlsafe(32)), nickname)

    token = security.create_token(user["id"], user["email"])
    return {"token": token, "user": _public_user(user)}


@router.get("/me")
def me(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "로그인이 필요합니다.")
    payload = security.decode_token(authorization.removeprefix("Bearer ").strip())
    if not payload:
        raise HTTPException(401, "세션이 만료되었습니다. 다시 로그인해 주세요.")
    user = db.find_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(401, "존재하지 않는 사용자입니다.")
    return {"user": _public_user(user)}
