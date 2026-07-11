import { useState } from "react";
import { recommend } from "../api/client";
import type { ChatMessage } from "../types";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}`;
}

export function useChat(seed: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const result = await recommend({ query: trimmed, limit: 3 });
      if (result.notices.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "bot",
            text: "조건에 맞는 지원사업을 찾아봤어요.",
            recommendation: {
              notices: result.notices,
              reason:
                result.reasonKeywords.length > 0
                  ? `${result.reasonKeywords.join(", ")} 키워드 매칭`
                  : "마감이 임박한 순으로 추천",
            },
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "bot", text: "조건에 딱 맞는 공고를 못 찾았어요. 다른 키워드로 다시 물어봐 주실래요?" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "bot", text: "지금 서버와 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return { messages, setMessages, input, setInput, send, sending };
}
