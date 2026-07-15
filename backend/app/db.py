"""SQLite 유저 저장소.

팀플 규모에서는 별도 DB 서버 없이 파일 하나로 충분해서 표준 라이브러리 sqlite3 사용.
DB 파일은 backend/users.db (gitignore 대상).
"""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

# Vercel 등 서버리스 환경은 코드 디렉터리가 읽기 전용이라 /tmp에 저장
# (인스턴스가 재활용될 때 초기화됨 — 데모용. 영구 저장이 필요하면 외부 DB로 교체)
if os.environ.get("VERCEL"):
    DB_PATH = Path("/tmp/users.db")
else:
    DB_PATH = Path(__file__).resolve().parent.parent / "users.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname      TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(_SCHEMA)


def create_user(email: str, password_hash: str, nickname: str) -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
            (email, password_hash, nickname),
        )
        row = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


def find_user_by_email(email: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def find_user_by_id(user_id: int) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None
