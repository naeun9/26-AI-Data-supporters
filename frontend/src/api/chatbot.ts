import type { ChatMessage, Notice } from "../types";
import { API_BASE as BASE } from "./base";
import { fetchAnnouncements } from "./kised";

interface ChatApiResponse {
  reply: string;
  notice_sns: number[];
  reason_keywords: string[];
  source: "claude" | "fallback";
}

export interface BotReply {
  reply: string;
  notices: Notice[];
  reason: string;
}

/**
 * 백엔드 AI 챗봇 호출. 대화 이력 전체를 보내고,
 * 백엔드가 돌려준 추천 공고 번호(pbanc_sn)를 프론트 공고 캐시와 매칭해 Notice로 변환한다.
 */
export async function askChatbot(history: ChatMessage[]): Promise<BotReply> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history.map((m) => ({ role: m.role, text: m.text })),
    }),
  });
  if (!res.ok) throw new Error(`chat api failed: ${res.status}`);
  const data = (await res.json()) as ChatApiResponse;

  const all = await fetchAnnouncements();
  const byId = new Map(all.map((n) => [n.id, n]));
  const notices = data.notice_sns
    .map((sn) => byId.get(String(sn)))
    .filter((n): n is Notice => Boolean(n))
    .map((n) => ({ ...n, recommended: true }));

  const reason =
    data.source === "claude"
      ? "AI 상담 기반 추천"
      : data.reason_keywords.length > 0
        ? `${data.reason_keywords.join(", ")} 키워드 매칭`
        : "마감이 임박한 순으로 추천";

  return { reply: data.reply, notices, reason };
}
