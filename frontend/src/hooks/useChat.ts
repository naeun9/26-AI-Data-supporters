import { useState } from "react";
import { askChatbot } from "../api/chatbot";
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

    const userMessage: ChatMessage = { id: nextId(), role: "user", text: trimmed };
    // askChatbot에 넘길 이력은 방금 보낸 메시지까지 포함해야 해서 setState와 별도로 구성
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setSending(true);

    try {
      const result = await askChatbot(history);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "bot",
          text: result.reply || "조건에 맞는 지원사업을 찾아봤어요.",
          ...(result.notices.length > 0 && {
            recommendation: { notices: result.notices, reason: result.reason },
          }),
        },
      ]);
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
