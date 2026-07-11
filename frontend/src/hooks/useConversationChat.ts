import { useEffect } from "react";
import { useAppState } from "../state/AppState";
import { useChat } from "./useChat";
import type { ChatMessage } from "../types";

export const DEFAULT_GREETING: ChatMessage = {
  id: "greeting",
  role: "bot",
  text: "안녕하세요! 어떤 창업을 준비 중이신가요? 조건을 말씀해주시면 맞는 지원사업을 찾아드릴게요.",
};

/** Ties the local chat message state (useChat) to the persisted conversation history in AppState. */
export function useConversationChat() {
  const { conversations, activeConversationId, createConversation, setActiveConversation, updateConversationMessages } =
    useAppState();
  // ChatFab과 ChatPage가 동시에 각자 useConversationChat()을 마운트할 수 있어서,
  // useChat()을 빈 배열로 시작하면 아래 sync effect가 마운트 즉시 활성 대화를 빈 메시지로 덮어써버림.
  // 마운트 시점에 이미 활성 대화가 있으면 그 메시지로 로컬 상태를 시작해서 그 덮어쓰기를 막는다.
  const initialMessages = conversations.find((c) => c.id === activeConversationId)?.messages ?? [];
  const chat = useChat(initialMessages);

  useEffect(() => {
    if (activeConversationId) updateConversationMessages(activeConversationId, chat.messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages]);

  function startNew(seed: ChatMessage[] = [DEFAULT_GREETING]) {
    createConversation(seed);
    chat.setMessages(seed);
  }

  function loadConversation(id: string) {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    setActiveConversation(id);
    chat.setMessages(conv.messages);
  }

  function loadActiveOrStart(seed: ChatMessage[] = [DEFAULT_GREETING]) {
    const current = conversations.find((c) => c.id === activeConversationId);
    if (current) {
      chat.setMessages(current.messages);
    } else {
      startNew(seed);
    }
  }

  return { ...chat, conversations, activeConversationId, startNew, loadConversation, loadActiveOrStart };
}
