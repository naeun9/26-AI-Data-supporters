"""KISED 공공데이터 프록시 API (FastAPI).

실행:  uvicorn app.main:app --reload
문서:  http://127.0.0.1:8000/docs
"""
import asyncio
import math
import time
from datetime import date

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from . import config, fields
from .kised_client import KisedClient, extract_items

app = FastAPI(title="KISED 공공데이터 프록시", version="0.2.0")

# Vite dev 서버에서 바로 호출 가능하도록 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

client = KisedClient()


@app.get("/health")
async def health():
    return {"ok": True, "key_loaded": bool(config.KISED_SERVICE_KEY)}


@app.get("/ops")
async def list_ops():
    """오퍼레이션 목록 + 허용 필터 + 응답 필드 라벨."""
    return {
        op: {
            "service": svc,
            "operation": path,
            "filters": config.FILTERS.get(op, []),
            "fields": fields.FIELD_LABELS.get(op, {}),
        }
        for op, (svc, path) in config.OPERATIONS.items()
    }


# ── 모집중 공고 (KISED 서버 필터가 rcrt_prgs_yn/날짜 파라미터를 무시하고
# 항상 전체를 반환하는 걸 확인했음 — 그래서 이 엔드포인트가 전량을 받아
# 직접 마감일로 걸러서, 프론트가 필요한 필드만 slim하게 돌려준다. ──────────
_ANNOUNCEMENT_PAGE_SIZE = 2000
_OPEN_ANNOUNCEMENT_CACHE: dict = {"items": None, "expires_at": 0.0}
# 실서비스가 아니라 트래픽이 적고, 공고 자체도 분 단위로 안 바뀌므로 며칠 단위로 넉넉하게.
# (서버 프로세스를 재시작하면 캐시는 어차피 초기화됨)
_OPEN_ANNOUNCEMENT_TTL_SECONDS = 3 * 24 * 60 * 60

_ANNOUNCEMENT_SLIM_FIELDS = [
    "pbanc_sn",
    "biz_pbanc_nm",
    "pbanc_ntrp_nm",
    "sprv_inst",
    "supt_biz_clsfc",
    "supt_regin",
    "aply_trgt",
    "biz_enyy",
    "pbanc_rcpt_bgng_dt",
    "pbanc_rcpt_end_dt",
    "detl_pg_url",
]

# 상세 페이지용 — 목록 slim 필드 + 본문/신청방법/링크/담당자 등.
_ANNOUNCEMENT_DETAIL_FIELDS = _ANNOUNCEMENT_SLIM_FIELDS + [
    "pbanc_ctnt",
    "aply_excl_trgt_ctnt",
    "aply_mthd_vst_rcpt_istc",
    "aply_mthd_pssr_rcpt_istc",
    "aply_mthd_fax_rcpt_istc",
    "aply_mthd_eml_rcpt_istc",
    "aply_mthd_onli_rcpt_istc",
    "aply_mthd_etc_istc",
    "biz_gdnc_url",
    "biz_aply_url",
    "prch_cnpl_no",
    "biz_prch_dprt_nm",
]


def _slim_announcement(item: dict) -> dict:
    return {k: item.get(k) for k in _ANNOUNCEMENT_SLIM_FIELDS}


def _detail_announcement(item: dict) -> dict:
    return {k: item.get(k) for k in _ANNOUNCEMENT_DETAIL_FIELDS}


def _is_open(item: dict, today: str) -> bool:
    """마감일(pbanc_rcpt_end_dt) 기준 '모집중' 판정. rcrt_prgs_yn 플래그는 갱신이
    늦는 경우가 있어(마감 지났는데 Y로 남아있는 건 다수 확인) 신뢰하지 않는다."""
    end = item.get("pbanc_rcpt_end_dt")
    if not end or len(end) != 8:
        return False
    return end >= today


async def _fetch_announcement_page(page: int, semaphore: asyncio.Semaphore) -> list[dict]:
    async with semaphore:
        for attempt in range(3):
            try:
                payload = await client.call("announcement", page=page, size=_ANNOUNCEMENT_PAGE_SIZE)
                return extract_items(payload)
            except (httpx.HTTPError, RuntimeError):
                if attempt == 2:
                    # 이 페이지는 포기하고 전체 수집은 계속 진행 (부분 실패에도 동작하도록)
                    return []
                await asyncio.sleep(0.5 * (attempt + 1))
        return []


async def _fetch_all_announcements() -> list[dict]:
    first_payload = await client.call("announcement", page=1, size=_ANNOUNCEMENT_PAGE_SIZE)
    total = first_payload.get("totalCount") or first_payload.get("matchCount") or 0
    items = extract_items(first_payload)

    pages = math.ceil(total / _ANNOUNCEMENT_PAGE_SIZE) if total else 1
    if pages <= 1:
        return items

    semaphore = asyncio.Semaphore(5)
    rest = await asyncio.gather(*(_fetch_announcement_page(p, semaphore) for p in range(2, pages + 1)))
    for chunk in rest:
        items.extend(chunk)
    return items


async def _get_open_announcements_full() -> list[dict]:
    """마감일이 지나지 않은 공고를 '전체 필드'로 캐싱 (slim 투영은 응답 시점에 별도로 함).
    상세 엔드포인트가 같은 캐시에서 pbanc_sn으로 찾아 쓸 수 있게 하기 위함 —
    목록에 뜨는(=모집중인) 공고 범위 밖은 애초에 프론트가 링크를 만들 수 없으므로 이걸로 충분."""
    now = time.time()
    if _OPEN_ANNOUNCEMENT_CACHE["items"] is not None and _OPEN_ANNOUNCEMENT_CACHE["expires_at"] > now:
        return _OPEN_ANNOUNCEMENT_CACHE["items"]

    all_items = await _fetch_all_announcements()
    today = date.today().strftime("%Y%m%d")
    open_items = [it for it in all_items if _is_open(it, today)]

    _OPEN_ANNOUNCEMENT_CACHE["items"] = open_items
    _OPEN_ANNOUNCEMENT_CACHE["expires_at"] = now + _OPEN_ANNOUNCEMENT_TTL_SECONDS
    return open_items


@app.get("/api/announcement/open")
async def get_open_announcements():
    """마감일이 지나지 않은 지원사업 공고만, 프론트가 쓰는 필드만 slim하게.
    서버 메모리에 30분 TTL로 캐싱 — KISED 전량(약 3만 건) 재수집은 캐시 만료 시에만."""
    try:
        items = await _get_open_announcements_full()
    except RuntimeError as e:
        raise HTTPException(500, str(e))
    return {"count": len(items), "items": [_slim_announcement(it) for it in items]}


@app.get("/api/announcement/{pbanc_sn}")
async def get_announcement_detail(pbanc_sn: int):
    """공고 상세 — KISED를 새로 호출하지 않고 /api/announcement/open과 같은 캐시에서 찾는다.
    캐시에 없으면(마감돼서 모집중 목록 밖이거나 잘못된 번호) 404."""
    try:
        items = await _get_open_announcements_full()
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    for it in items:
        if it.get("pbanc_sn") == pbanc_sn:
            return _detail_announcement(it)
    raise HTTPException(404, f"공고를 찾을 수 없음(마감됐거나 잘못된 번호): {pbanc_sn}")


@app.get("/api/{op}")
async def get_data(op: str, request: Request):
    """공용 프록시.

    예) /api/announcement?page=1&size=5&biz_pbanc_nm=창업
        /api/content?size=10&clss_cd=fnd_scs_case
    page/size 외 쿼리스트링 중 config.FILTERS[op] 에 있는 것만 필터로 전달.
    raw=1 붙이면 KISED 원본 응답 그대로, 없으면 {count, items} 로 정리해서 반환.
    """
    if op not in config.OPERATIONS:
        raise HTTPException(404, f"지원하지 않는 op: {op} (/ops 참고)")

    qp = request.query_params
    page = int(qp.get("page", 1))
    size = int(qp.get("size", 10))
    raw = qp.get("raw") in ("1", "true")
    reserved = {"page", "size", "raw"}
    filters = {k: v for k, v in qp.items() if k not in reserved}

    try:
        payload = await client.call(op, page=page, size=size, **filters)
    except RuntimeError as e:
        raise HTTPException(500, str(e))
    except httpx.HTTPError as e:
        raise HTTPException(502, f"KISED API 호출 실패: {e}")

    if raw:
        return payload
    items = extract_items(payload)
    return {"op": op, "page": page, "size": size, "count": len(items), "items": items}
