"""글로벌 창업 프로그램 소스 수집 레이어.

현재 어댑터: Devpost (공개 JSON API, 오픈 해커톤/챌린지).
F6S·Gust·이벤터스 등은 공개 API가 없어(스크래핑은 약관 위반 소지) 어댑터 자리만 남겨둠 —
API 키나 제휴가 생기면 _fetch_* 함수 하나 추가로 확장.
"""
import re
import time

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/global", tags=["global"])

_CACHE: dict = {"items": None, "expires_at": 0.0}
_TTL_SECONDS = 6 * 60 * 60

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

_TAG_RE = re.compile(r"<[^>]+>")


async def _fetch_devpost(client: httpx.AsyncClient) -> list[dict]:
    items: list[dict] = []
    for page in (1, 2, 3):
        r = await client.get("https://devpost.com/api/hackathons", params={"page": page})
        if r.status_code != 200:
            break
        for h in r.json().get("hackathons", []):
            if h.get("open_state") != "open":
                continue
            thumb = h.get("thumbnail_url") or ""
            if thumb.startswith("//"):
                thumb = "https:" + thumb
            items.append(
                {
                    "source": "devpost",
                    "id": f"devpost-{h.get('id')}",
                    "title": h.get("title"),
                    "url": h.get("url"),
                    "thumbnail": thumb,
                    "organization": h.get("organization_name"),
                    "themes": [t.get("name") for t in (h.get("themes") or []) if t.get("name")],
                    "deadline_text": h.get("time_left_to_submission"),
                    "dates": h.get("submission_period_dates"),
                    "prize": _TAG_RE.sub("", h.get("prize_amount") or ""),
                    "location": (h.get("displayed_location") or {}).get("location"),
                }
            )
    return items


@router.get("/opportunities")
async def global_opportunities():
    """글로벌 프로그램 목록 — 6시간 캐시."""
    now = time.time()
    if _CACHE["items"] is not None and _CACHE["expires_at"] > now:
        return {"count": len(_CACHE["items"]), "items": _CACHE["items"]}

    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=20, headers=_HEADERS, follow_redirects=True) as client:
            items.extend(await _fetch_devpost(client))
    except httpx.HTTPError as e:
        if _CACHE["items"] is not None:  # 오래된 캐시라도 있으면 그걸 반환
            return {"count": len(_CACHE["items"]), "items": _CACHE["items"]}
        raise HTTPException(502, f"글로벌 소스 수집 실패: {e}")

    _CACHE["items"] = items
    _CACHE["expires_at"] = now + _TTL_SECONDS
    return {"count": len(items), "items": items}
