import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { ChatMessage, Conversation, TypeKey } from "../types";

interface Profile {
  loggedIn: boolean;
  nickname: string;
  myType: TypeKey | null;
  testedAt: string | null;
  bookmarks: string[];
  conversations: Conversation[];
  activeConversationId: string | null;
}

const STORAGE_KEY = "changupmate.profile";

const EMPTY_PROFILE: Profile = {
  loggedIn: false,
  nickname: "",
  myType: null,
  testedAt: null,
  bookmarks: [],
  conversations: [],
  activeConversationId: null,
};

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<Profile>;
      return { ...EMPTY_PROFILE, ...stored };
    }
  } catch {
    // ignore corrupt storage
  }
  return { ...EMPTY_PROFILE };
}

function nextConversationId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** (임시) 로그인 시 대화 기록이 하나도 없으면 채워주는 예시 1건 — 마이페이지/챗봇 탭이 같은 데이터를 보게 함. */
const SEED_CONVERSATION: Conversation = {
  id: "seed-conv-1",
  title: "AI 의료 번역 서비스 준비 중이에요",
  sub: "대화 중",
  messages: [
    { id: "seed-conv-1-m1", role: "bot", text: "어떤 창업을 준비하고 계세요? 편하게 말씀해 주세요." },
    { id: "seed-conv-1-m2", role: "user", text: "AI 의료 번역 서비스를 준비 중이에요. 아직 예비창업자예요." },
    {
      id: "seed-conv-1-m3",
      role: "bot",
      text: "좋아요! 예비창업자 대상 지원사업 위주로 살펴보시면 좋을 것 같아요. 지원공고 탭에서 '예비창업자' 필터로 확인해보세요.",
    },
  ],
};

interface AppStateValue extends Profile {
  tested: boolean;
  unlocked: boolean;
  login: (nickname?: string) => void;
  logout: () => void;
  signup: (nickname: string) => void;
  completeTest: (type: TypeKey) => void;
  resetTest: () => void;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  createConversation: (seedMessages: ChatMessage[]) => string;
  setActiveConversation: (id: string) => void;
  updateConversationMessages: (id: string, messages: ChatMessage[]) => void;
  chatPopupOpen: boolean;
  openChatPopup: () => void;
  closeChatPopup: () => void;
  toast: string | null;
  showToast: (message: string) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const value = useMemo<AppStateValue>(() => {
    const bookmarkSet = new Set(profile.bookmarks);
    return {
      ...profile,
      tested: profile.myType !== null,
      unlocked: profile.loggedIn && profile.myType !== null,
      login: (nickname = "홍길동") =>
        setProfile((p) =>
          p.conversations.length > 0
            ? { ...p, loggedIn: true, nickname }
            : {
                ...p,
                loggedIn: true,
                nickname,
                conversations: [SEED_CONVERSATION],
                activeConversationId: SEED_CONVERSATION.id,
              },
        ),
      logout: () => setProfile((p) => ({ ...p, loggedIn: false })),
      signup: (nickname: string) =>
        setProfile((p) => ({ ...p, loggedIn: true, nickname })),
      completeTest: (type: TypeKey) =>
        setProfile((p) => ({ ...p, myType: type, testedAt: new Date().toISOString() })),
      resetTest: () => setProfile((p) => ({ ...p, myType: null, testedAt: null })),
      toggleBookmark: (id: string) =>
        setProfile((p) => {
          const next = new Set(p.bookmarks);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { ...p, bookmarks: Array.from(next) };
        }),
      isBookmarked: (id: string) => bookmarkSet.has(id),
      createConversation: (seedMessages: ChatMessage[]) => {
        const id = nextConversationId();
        const conversation: Conversation = { id, title: "새 대화", sub: "방금 전", messages: seedMessages };
        setProfile((p) => ({
          ...p,
          conversations: [conversation, ...p.conversations],
          activeConversationId: id,
        }));
        return id;
      },
      setActiveConversation: (id: string) => setProfile((p) => ({ ...p, activeConversationId: id })),
      updateConversationMessages: (id: string, messages: ChatMessage[]) =>
        setProfile((p) => ({
          ...p,
          conversations: p.conversations.map((c) => {
            if (c.id !== id) return c;
            const firstUser = messages.find((m) => m.role === "user");
            const recCount = messages.filter((m) => m.recommendation).length;
            return {
              ...c,
              messages,
              title: firstUser ? firstUser.text.slice(0, 22) : c.title,
              sub: recCount > 0 ? `${recCount}개 추천` : "대화 중",
            };
          }),
        })),
      chatPopupOpen,
      openChatPopup: () => setChatPopupOpen(true),
      closeChatPopup: () => setChatPopupOpen(false),
      toast,
      showToast,
    };
  }, [profile, chatPopupOpen, toast]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
