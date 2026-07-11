import { Check } from "lucide-react";
import type { ChatMessage } from "../types";
import "./ChatBubble.css";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isBot = message.role === "bot";
  return (
    <div className={`chat-msg-wrap${isBot ? "" : " user"}`}>
      {isBot && <span className="chat-avatar">K</span>}
      <div className={`chat-bubble${isBot ? " bot" : " user"}`}>
        {message.text}
        {message.recommendation && (
          <div className="chat-rec-card">
            <div className="chat-rec-title">AI 추천 공고 {message.recommendation.notices.length}</div>
            <div className="chat-rec-list">
              {message.recommendation.notices.map((n) => (
                <div key={n.id} className="chat-rec-item">
                  <Check size={16} className="chat-rec-check" /> {n.title}
                </div>
              ))}
            </div>
            <div className="chat-rec-reason">추천 이유: {message.recommendation.reason}</div>
          </div>
        )}
      </div>
    </div>
  );
}
