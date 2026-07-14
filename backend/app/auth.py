"""회원가입 / 로그인 / 내 정보 조회 API.

- POST /api/auth/signup  {email, password, nickname} → {token, user}
- POST /api/auth/login   {email, password}           → {token, user}
- GET  /api/auth/me      (Authorization: Bearer ...) → {user}
"""
import re

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from . import db, security

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
