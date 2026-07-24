"""관리자 전용 API — 가입 회원 목록 + 이용 이벤트 조회.

비밀번호(config.ADMIN_PASSWORD)를 X-Admin-Key 헤더로 받아 검증한다.
※ Vercel 서버리스는 SQLite가 /tmp라 인스턴스 재활용 시 초기화됨(데모용).
   회원/이벤트를 영구 보관하려면 외부 DB(Postgres 등)로 교체 필요.
"""
import hmac

from fastapi import APIRouter, Header, HTTPException

from . import config, db

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _check(key: str) -> None:
    if not hmac.compare_digest(key or "", config.ADMIN_PASSWORD):
        raise HTTPException(401, "관리자 비밀번호가 올바르지 않습니다.")


@router.post("/verify")
def verify(x_admin_key: str = Header(default="")):
    """비밀번호만 확인 (프론트 로그인 게이트용)."""
    _check(x_admin_key)
    return {"ok": True}


@router.get("/overview")
def overview(x_admin_key: str = Header(default="")):
    """대시보드 데이터 — 통계 + 회원 목록 + 최근 이용 이벤트."""
    _check(x_admin_key)
    return {
        "stats": db.admin_stats(),
        "users": db.list_users(),
        "events": db.recent_events(150),
    }
