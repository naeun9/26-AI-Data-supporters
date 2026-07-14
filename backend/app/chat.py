"""AI 챗봇 API — Claude 기반 창업 지원사업 추천.

- POST /api/chat  {messages: [{role: "user"|"bot", text}]}
  → {reply, notice_sns, reason_keywords, source}

동작 방식(mini-RAG):
1. 서버에 캐시된 '모집중 공고'에서 사용자 질문과 키워드가 겹치는 후보를 추림
2. 후보 목록을 Claude에게 컨텍스트로 주고, 한국어 상담 답변 + 추천할 공고 번호(pbanc_sn)를
   JSON(구조화 출력)으로 받음
3. ANTHROPIC_API_KEY가 없거나 호출 실패 시 키워드 매칭만으로 폴백 — 챗봇이 죽지는 않게

프론트는 notice_sns를 이미 갖고 있는 공고 목록(fetchAnnouncements 캐시)과 매칭해서
추천 카드를 그린다.
"""
import json
from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from . import config

router = APIRouter(prefix="/api", tags=["chat"])

_CANDIDATE_LIMIT = 12   # Claude에게 보여줄 후보 공고 수
_RECOMMEND_LIMIT = 3    # 최종 추천 수

_SYSTEM_PROMPT = """\
너는 '창업메이트'의 AI 창업 상담사야. 예비창업자와 초기 창업자에게 정부·지자체 창업 지원사업을 찾아주는 역할을 한다.

규칙:
- 반드시 한국어로, 친근하고 간결하게 답한다 (2~4문장).
- 제공된 후보 공고 목록 안에서만 추천한다. 목록에 없는 공고를 지어내지 않는다.
- 사용자의 조건(업종, 지역, 창업 단계, 나이 등)과 맞는 공고를 최대 3개 고른다.
- 조건에 맞는 공고가 없으면 빈 배열을 반환하고, 어떤 조건을 알려주면 좋을지 되물어본다.
- 마감이 임박한 공고는 서둘러야 한다고 알려준다.
- 추천 이유를 답변에 자연스럽게 녹여서 설명한다 (공고 번호 같은 내부 식별자는 언급하지 않는다).
"""

_OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string", "description": "사용자에게 보여줄 한국어 답변"},
        "notice_sns": {
            "type": "array",
            "items": {"type": "integer"},
            "description": "추천하는 공고의 pbanc_sn 목록 (최대 3개, 없으면 빈 배열)",
        },
    },
    "required": ["reply", "notice_sns"],
    "additionalProperties": False,
}


class ChatMessageIn(BaseModel):
    role: str  # "user" | "bot"
    text: str


class ChatBody(BaseModel):
    messages: list[ChatMessageIn]


def _tokenize(text: str) -> list[str]:
    return [tok for tok in text.replace(",", " ").split() if len(tok) >= 2]


def _haystack(item: dict) -> str:
    return " ".join(
        str(item.get(k) or "")
        for k in (
            "biz_pbanc_nm", "pbanc_ntrp_nm", "sprv_inst", "supt_biz_clsfc",
            "supt_regin", "aply_trgt", "biz_enyy", "biz_trgt_age", "pbanc_ctnt",
        )
    )


def _score_candidates(items: list[dict], query: str) -> list[tuple[dict, list[str]]]:
    """(공고, 매칭된 토큰들) 리스트를 점수순으로 반환. 매칭 0점은 제외."""
    tokens = _tokenize(query)
    scored = []
    for it in items:
        hay = _haystack(it)
        matched = [t for t in tokens if t in hay]
        if matched:
            scored.append((it, matched))
    scored.sort(key=lambda pair: (-len(pair[1]), pair[0].get("pbanc_rcpt_end_dt") or "99999999"))
    return scored


def _candidate_line(item: dict) -> str:
    return (
        f"- pbanc_sn={item.get('pbanc_sn')} | {item.get('biz_pbanc_nm')} | "
        f"기관: {item.get('pbanc_ntrp_nm') or item.get('sprv_inst') or '창업진흥원'} | "
        f"분야: {item.get('supt_biz_clsfc') or '기타'} | 지역: {item.get('supt_regin') or '전국'} | "
        f"대상: {item.get('aply_trgt') or '제한없음'} | 창업기간: {item.get('biz_enyy') or '제한없음'} | "
        f"마감일: {item.get('pbanc_rcpt_end_dt') or '상시'}"
    )


async def _ask_claude(history: list[ChatMessageIn], candidates: list[dict]) -> dict:
    """Claude에게 후보 공고와 대화 이력을 주고 답변 + 추천 공고를 JSON으로 받는다."""
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)

    today = date.today().strftime("%Y%m%d")
    context = (
        f"오늘 날짜: {today}\n\n"
        f"[모집중인 후보 공고 목록]\n" + "\n".join(_candidate_line(c) for c in candidates)
        if candidates
        else f"오늘 날짜: {today}\n\n[후보 공고 목록이 비어 있음 — 사용자 질문과 겹치는 공고를 찾지 못함]"
    )

    messages = []
    for m in history[-10:]:  # 최근 10턴만 전달
        role = "user" if m.role == "user" else "assistant"
        messages.append({"role": role, "content": m.text})
    # 마지막 user 턴에 후보 공고 컨텍스트를 붙인다
    if messages and messages[-1]["role"] == "user":
        messages[-1]["content"] = f"{context}\n\n[사용자 메시지]\n{messages[-1]['content']}"
    else:
        messages.append({"role": "user", "content": context})

    response = await client.messages.create(
        model="claude-opus-4-8",
        max_tokens=2048,
        system=_SYSTEM_PROMPT,
        thinking={"type": "adaptive"},
        output_config={
            "effort": "low",
            "format": {"type": "json_schema", "schema": _OUTPUT_SCHEMA},
        },
        messages=messages,
    )

    text = next(b.text for b in response.content if b.type == "text")
    return json.loads(text)


def _fallback_reply(history: list[ChatMessageIn], scored: list[tuple[dict, list[str]]]) -> dict:
    """Claude를 못 쓸 때: 키워드 매칭 결과만으로 응답 구성."""
    top = scored[:_RECOMMEND_LIMIT]
    if not top:
        return {
            "reply": "조건에 딱 맞는 공고를 못 찾았어요. 업종이나 지역, 창업 단계(예비창업자/기창업자)를 알려주시면 다시 찾아볼게요!",
            "notice_sns": [],
            "reason_keywords": [],
        }
    keywords = sorted({t for _, matched in top for t in matched})[:3]
    return {
        "reply": f"'{', '.join(keywords)}' 조건으로 모집 중인 지원사업을 찾아봤어요. 마감일을 꼭 확인해 보세요!",
        "notice_sns": [it.get("pbanc_sn") for it, _ in top],
        "reason_keywords": keywords,
    }


@router.post("/chat")
async def chat(body: ChatBody):
    user_turns = [m for m in body.messages if m.role == "user" and m.text.strip()]
    if not user_turns:
        raise HTTPException(400, "사용자 메시지가 없습니다.")
    query = user_turns[-1].text

    # 순환 import 방지를 위해 지연 import — main.py의 공고 캐시를 그대로 재사용
    from .main import _get_open_announcements_full

    try:
        items = await _get_open_announcements_full()
    except Exception:
        items = []

    scored = _score_candidates(items, query)
    candidates = [it for it, _ in scored[:_CANDIDATE_LIMIT]]

    if config.ANTHROPIC_API_KEY:
        try:
            result = await _ask_claude(body.messages, candidates)
            valid_sns = {it.get("pbanc_sn") for it in candidates}
            notice_sns = [sn for sn in result.get("notice_sns", []) if sn in valid_sns][:_RECOMMEND_LIMIT]
            return {
                "reply": result.get("reply", ""),
                "notice_sns": notice_sns,
                "reason_keywords": [],
                "source": "claude",
            }
        except Exception:
            pass  # Claude 실패 시 아래 폴백으로

    return {**_fallback_reply(body.messages, scored), "source": "fallback"}
