"""KISED 공공데이터 API 호출 클라이언트."""
from __future__ import annotations

import httpx

from . import config


class KisedClient:
    def __init__(self, service_key: str | None = None, timeout: float = 10.0):
        self.service_key = service_key or config.KISED_SERVICE_KEY
        self.timeout = timeout

    def _url(self, op: str) -> str:
        service, operation = config.OPERATIONS[op]  # op 없으면 KeyError
        return f"{config.SERVICES[service]}/{operation}"

    async def call(self, op: str, page: int = 1, size: int = 10, **filters):
        """op = OPERATIONS 의 키(announcement, content, business ...).

        filters = 공고명/지원분야 등 조회 조건. config.FILTERS[op] 에
        정의된 키만 전달되고 나머지는 무시된다.
        """
        if not self.service_key:
            raise RuntimeError("KISED_SERVICE_KEY 가 비어있음 (.env 확인)")

        allowed = set(config.FILTERS.get(op, []))
        clean_filters = {
            k: v for k, v in filters.items() if k in allowed and v not in (None, "")
        }

        params = {
            # 일반 인증키(Decoding, 평문)를 그대로. httpx 가 자동 인코딩함.
            "serviceKey": self.service_key,
            config.PAGE_PARAM: page,
            config.SIZE_PARAM: size,
            config.FORMAT_PARAM: config.FORMAT_VALUE,
            **clean_filters,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self._url(op), params=params)
            resp.raise_for_status()

        ctype = resp.headers.get("content-type", "").lower()
        if "json" in ctype:
            return resp.json()
        # returnType 이 안 먹혀 XML/텍스트로 오면 원문(디버깅용)
        return {"content_type": ctype, "raw": resp.text[:3000]}


def extract_items(payload: dict) -> list[dict]:
    """응답 JSON 에서 레코드 리스트를 방어적으로 추출.

    인프라 API 응답 형태가 확정 전이라(문서 예제는 XML 기준)
    흔한 경로를 순서대로 시도한다. 실제 응답 한 번 확인 후 정리 권장.
    """
    if not isinstance(payload, dict):
        return []
    # 1) 인프라(odcloud) 표준: {"data": [...]}
    if isinstance(payload.get("data"), list):
        return payload["data"]
    # 2) {"items": [...]} 또는 {"items": {"item": [...]}}
    items = payload.get("items")
    if isinstance(items, list):
        return items
    if isinstance(items, dict) and isinstance(items.get("item"), list):
        return items["item"]
    # 3) 전통 규격: {"response": {"body": {"items": {"item": [...]}}}}
    body = payload.get("response", {}).get("body", {}) if isinstance(payload.get("response"), dict) else {}
    it = body.get("items")
    if isinstance(it, dict) and isinstance(it.get("item"), list):
        return it["item"]
    if isinstance(it, list):
        return it
    return []
