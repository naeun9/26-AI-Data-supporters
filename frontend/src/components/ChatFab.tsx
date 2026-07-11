import { useEffect } from "react";
import { MessageCircle, Maximize2, X, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { useConversationChat } from "../hooks/useConversationChat";
import { ChatBubble } from "./ChatBubble";
import "./ChatFab.css";

export function ChatFab() {
  const { loggedIn, chatPopupOpen, openChatPopup, closeChatPopup } = useAppState();
  const navigate = useNavigate();
  const { messages, input, setInput, send, sending, loadActiveOrStart } = useConversationChat();

  useEffect(() => {
    if (chatPopupOpen) loadActiveOrStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatPopupOpen]);

  if (!loggedIn) return null;

  function expand() {
    closeChatPopup();
    navigate("/chat");
  }

  return (
    <>
      {chatPopupOpen && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            <div className="chat-popup-title">
              <span className="chat-avatar">K</span>
              <span>AI 챗봇</span>
            </div>
            <div className="chat-popup-actions">
              <button className="chat-popup-icon-btn" aria-label="전체화면으로 열기" onClick={expand}>
                <Maximize2 size={16} />
              </button>
              <button className="chat-popup-icon-btn" aria-label="닫기" onClick={closeChatPopup}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="chat-popup-messages">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
          </div>
          <form
            className="chat-popup-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="chat-popup-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요…"
              disabled={sending}
            />
            <button type="submit" className="chat-popup-send" disabled={sending} aria-label="보내기">
              <Send size={17} />
            </button>
          </form>
        </div>
      )}

      <button className="chat-fab" onClick={openChatPopup} aria-label="챗봇 열기">
        <MessageCircle size={24} />
      </button>
    </>
  );
}
