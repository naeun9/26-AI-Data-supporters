import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Send } from "lucide-react";
import { useAppState } from "../state/AppState";
import { useConversationChat } from "../hooks/useConversationChat";
import { recommend } from "../api/client";
import { ChatBubble } from "../components/ChatBubble";
import { TypeIcon } from "../icons/TypeIcon";
import { TYPE_NAMES } from "../data/typeNames";
import type { ChatMessage } from "../types";
import "./ChatPage.css";

const GREETING: ChatMessage = {
  id: "seed-1",
  role: "bot",
  text: "어떤 창업을 준비하고 계세요? 편하게 말씀해 주세요.",
};

async function buildDemoSeed(): Promise<ChatMessage[]> {
  const result = await recommend({ query: "AI 의료 서비스 예비창업", limit: 3 });
  return [
    GREETING,
    { id: "seed-2", role: "user", text: "AI 의료 번역 서비스 준비 중이에요" },
    { id: "seed-3", role: "bot", text: "좋아요. 아직 법인은 설립 전이신가요?" },
    { id: "seed-4", role: "user", text: "네, 예비창업자예요" },
    {
      id: "seed-5",
      role: "bot",
      text: "조건에 맞는 추천 공고를 찾았어요.",
      recommendation: {
        notices: result.notices,
        reason: result.reasonKeywords.length > 0 ? `${result.reasonKeywords.join(", ")} 키워드 매칭` : "마감이 임박한 순으로 추천",
      },
    },
  ];
}

export function ChatPage() {
  const { loggedIn, myType } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    messages,
    input,
    setInput,
    send,
    sending,
    conversations,
    activeConversationId,
    startNew,
    loadConversation,
    loadActiveOrStart,
  } = useConversationChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const q = searchParams.get("q");
    if (q) {
      startNew([GREETING]);
      send(q);
      setSearchParams({}, { replace: true });
      return;
    }
    if (activeConversationId) {
      loadActiveOrStart([GREETING]);
      return;
    }
    // No saved conversation yet: seed the first one with the notice-recommendation demo.
    buildDemoSeed()
      .then((seed) => startNew(seed))
      .catch(() => startNew([GREETING]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <main className="container chat-main">
      <aside className="chat-sidebar">
        <button
          className="btn btn-primary chat-new-btn"
          onClick={() =>
            startNew([{ id: `fresh-${Date.now()}`, role: "bot", text: "새 대화를 시작할게요. 어떤 창업을 준비하세요?" }])
          }
        >
          <Plus size={16} /> 새 대화
        </button>
        <div className="chat-history-label">대화 기록</div>
        <div className="chat-history-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`chat-history-item${activeConversationId === c.id ? " active" : ""}`}
              onClick={() => loadConversation(c.id)}
            >
              <div className="chat-history-title">{c.title}</div>
              <div className="chat-history-sub">{c.sub}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-panel">
        <div className="chat-panel-header">
          <div className="chat-panel-header-left">
            <span className="chat-avatar chat-panel-avatar">K</span>
            <div>
              <div className="chat-panel-title">AI 챗봇</div>
              <div className="chat-panel-sub">대화하며 조건에 맞는 공고를 추천받아요</div>
            </div>
          </div>
          {loggedIn && myType && (
            <span className="chat-type-pill">
              <TypeIcon type={myType} size={15} /> 내 유형: {TYPE_NAMES[myType]}
            </span>
          )}
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {(messages.length > 0 ? messages : [GREETING]).map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>

        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요…"
            disabled={sending}
          />
          <button type="submit" className="chat-send-btn" disabled={sending} aria-label="보내기">
            <Send size={20} />
          </button>
        </form>
      </section>
    </main>
  );
}
