"""기업마당(bizinfo.go.kr) 지원사업 공고 수집.

중소벤처기업부 기업마당 오픈API. BIZINFO_API_KEY(crtfcKey)가 설정돼 있어야 동작하며,
없으면 빈 목록을 돌려줘 프론트가 KISED 단독으로 동작한다.
응답은 KISED slim 공고와 같은 필드명으로 정규화 — 프론트 매칭 로직을 그대로 재사용.
"""
import os
import re
import time
from datetime import date

import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/bizinfo", tags=["bizinfo"])

BIZINFO_API_KEY: str = os.getenv("BIZINFO_API_KEY", "")

_CACHE: dict = {"items": None, "expires_at": 0.0}
_TTL_SECONDS = 6 * 60 * 60

_TAG_RE = re.compile(r"<[^>]+>")


def _parse_period(raw: str | None) -> tuple[str | None, str | None]:
    """'2026-07-24 ~ 2026-08-14' → ('20260724','20260814'). 상시/예산소진시 등은 (None, None)."""
    if not raw:
        return None, None
    # YYYY-MM-DD / YYYY.MM.DD / YYYYMMDD 모두 허용 → YYYYMMDD로 정규화
    dates = ["".join(m) for m in re.findall(r"(20\d{2})[.\-]?(\d{2})[.\-]?(\d{2})", raw)]
    if len(dates) >= 2:
        return dates[0], dates[1]
    if len(dates) == 1:
        return None, dates[0]
    return None, None


def _normalize(item: dict, idx: int) -> dict | None:
    title = _TAG_RE.sub("", item.get("pblancNm") or "").strip()
    if not title:
        return None
    bgng, end = _parse_period(item.get("reqstBeginEndDe"))
    url = item.get("pblancUrl") or ""
    if url and not url.startswith("http"):
        url = f"https://www.bizinfo.go.kr{url}"
    hashtags = [t.strip() for t in (item.get("hashtags") or "").split(",") if t.strip()]
    return {
        # KISED pbanc_sn(양수)과 충돌하지 않도록 음수 번호 부여
        "pbanc_sn": -(idx + 1),
        "biz_pbanc_nm": title,
        "pbanc_ntrp_nm": item.get("excInsttNm") or item.get("jrsdInsttNm"),
        "sprv_inst": item.get("jrsdInsttNm"),
        "supt_biz_clsfc": item.get("pldirSportRealmLclasCodeNm"),
        "supt_regin": None,
        "aply_trgt": item.get("trgetNm"),
        "biz_enyy": None,
        "biz_trgt_age": None,
        "pbanc_rcpt_bgng_dt": bgng,
        "pbanc_rcpt_end_dt": end,
        "detl_pg_url": url or None,
        "industries": hashtags[:6],
        "source": "bizinfo",
    }


@router.get("/open")
async def bizinfo_open():
    """모집 중(마감 전 또는 상시)인 기업마당 공고 — 6시간 캐시."""
    if not BIZINFO_API_KEY:
        return {"count": 0, "items": [], "enabled": False}

    now = time.time()
    if _CACHE["items"] is not None and _CACHE["expires_at"] > now:
        return {"count": len(_CACHE["items"]), "items": _CACHE["items"], "enabled": True}

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.get(
                "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do",
                params={"crtfcKey": BIZINFO_API_KEY, "dataType": "json", "searchCnt": "600"},
                headers={"User-Agent": "Mozilla/5.0"},
            )
        raw = r.json()
        rows = raw.get("jsonArray") or raw.get("item") or []
    except Exception:
        if _CACHE["items"] is not None:
            return {"count": len(_CACHE["items"]), "items": _CACHE["items"], "enabled": True}
        return {"count": 0, "items": [], "enabled": True}

    today = date.today().strftime("%Y%m%d")
    items = []
    for i, row in enumerate(rows):
        n = _normalize(row, i)
        if not n:
            continue
        end = n["pbanc_rcpt_end_dt"]
        # 마감일이 있으면 지난 것 제외, 없으면(상시 등) 포함
        if end and end < today:
            continue
        items.append(n)

    _CACHE["items"] = items
    _CACHE["expires_at"] = now + _TTL_SECONDS
    return {"count": len(items), "items": items, "enabled": True}
