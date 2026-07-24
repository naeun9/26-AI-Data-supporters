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
CREATE TABLE IF NOT EXISTS login_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    email      TEXT,
    nickname   TEXT,
    kind       TEXT NOT NULL,   -- signup | login | google
    at         TEXT NOT NULL DEFAULT (datetime('now'))
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


# ── 관리자용: 이용 이벤트 기록 / 조회 ──────────────────────────────
def log_event(kind: str, user: dict | None = None) -> None:
    try:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO login_events (user_id, email, nickname, kind) VALUES (?, ?, ?, ?)",
                (
                    user.get("id") if user else None,
                    user.get("email") if user else None,
                    user.get("nickname") if user else None,
                    kind,
                ),
            )
    except sqlite3.Error:
        pass  # 로깅 실패가 본 기능(로그인)을 막지 않도록


def list_users() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, email, nickname, created_at FROM users ORDER BY id DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def recent_events(limit: int = 100) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT kind, email, nickname, at FROM login_events ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]


def admin_stats() -> dict:
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) c FROM users").fetchone()["c"]
        today_signups = conn.execute(
            "SELECT COUNT(*) c FROM users WHERE date(created_at) = date('now')"
        ).fetchone()["c"]
        logins = conn.execute(
            "SELECT COUNT(*) c FROM login_events WHERE kind IN ('login','google')"
        ).fetchone()["c"]
        logins_today = conn.execute(
            "SELECT COUNT(*) c FROM login_events "
            "WHERE kind IN ('login','google') AND date(at) = date('now')"
        ).fetchone()["c"]
        return {
            "total_users": total,
            "today_signups": today_signups,
            "total_logins": logins,
            "logins_today": logins_today,
        }
