"""Vercel Python 서버리스 함수 엔트리포인트.

backend/의 FastAPI 앱을 그대로 노출한다. vercel.json의 rewrite가
/api/* 요청을 전부 이 함수로 보내고, 원래 경로가 유지되므로
FastAPI 라우팅(/api/announcement/open, /api/auth/login 등)이 그대로 동작한다.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402, F401  (Vercel이 ASGI `app`을 감지)
