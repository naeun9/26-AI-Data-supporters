import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { fetchGoogleClientId, googleLoginApi, loginApi, signupApi } from "../api/auth";
import { getGoogleAccessToken } from "../api/google";
import type { ChatMessage, Conversation, TypeKey } from "../types";

interface Profile {
  loggedIn: boolean;
  nickname: string;
  /** 백엔드 로그인 시 발급되는 JWT. 소셜(목업) 로그인은 null. */
  authToken: string | null;
  email: string | null;
  myType: TypeKey | null;
  testedAt: string | null;
  /** 창업기간(biz_enyy) 토큰 하나 — 예비창업자/1년미만/.../10년미만 중 하나, 미설정 시 null. */
  myStage: string | null;
  /** supt_regin 값 하나 — 미설정 시 null(전 지역). */
  myRegion: string | null;
  bookmarks: string[];
  conversations: Conversation[];
  activeConversationId: string | null;
}

const STORAGE_KEY = "changupmate.profile";

const EMPTY_PROFILE: Profile = {
  loggedIn: false,
  nickname: "",
  authToken: null,
  email: null,
  myType: null,
  testedAt: null,
  myStage: null,
  myRegion: null,
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

interface AppStateValue extends Profile {
  tested: boolean;
  unlocked: boolean;
  logout: () => void;
  /** 백엔드 이메일 로그인 — 실패 시 한국어 메시지가 담긴 Error를 던진다. */
  loginWithEmail: (email: string, password: string) => Promise<void>;
  /** 백엔드 이메일 회원가입 — 실패 시 한국어 메시지가 담긴 Error를 던진다. */
  signupWithEmail: (email: string, password: string, nickname: string) => Promise<void>;
  /** 실제 구글 OAuth 로그인 (가입 겸용) — 실패/취소 시 한국어 Error를 던진다. */
  loginWithGoogle: () => Promise<void>;
  completeTest: (type: TypeKey) => void;
  resetTest: () => void;
  setMyStage: (stage: string | null) => void;
  setMyRegion: (region: string | null) => void;
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
      logout: () => setProfile((p) => ({ ...p, loggedIn: false, authToken: null })),
      loginWithEmail: async (email: string, password: string) => {
        const { token, user } = await loginApi(email, password);
        setProfile((p) => ({
          ...p,
          loggedIn: true,
          nickname: user.nickname,
          authToken: token,
          email: user.email,
        }));
      },
      signupWithEmail: async (email: string, password: string, nickname: string) => {
        const { token, user } = await signupApi(email, password, nickname);
        setProfile((p) => ({
          ...p,
          loggedIn: true,
          nickname: user.nickname,
          authToken: token,
          email: user.email,
        }));
      },
      loginWithGoogle: async () => {
        const clientId = await fetchGoogleClientId();
        if (!clientId) {
          throw new Error("구글 로그인이 아직 설정되지 않았어요. (서버에 GOOGLE_CLIENT_ID 필요)");
        }
        const accessToken = await getGoogleAccessToken(clientId);
        const { token, user } = await googleLoginApi(accessToken);
        setProfile((p) => ({
          ...p,
          loggedIn: true,
          nickname: user.nickname,
          authToken: token,
          email: user.email,
        }));
      },
      completeTest: (type: TypeKey) =>
        setProfile((p) => ({ ...p, myType: type, testedAt: new Date().toISOString() })),
      resetTest: () => setProfile((p) => ({ ...p, myType: null, testedAt: null })),
      setMyStage: (stage: string | null) => setProfile((p) => ({ ...p, myStage: stage })),
      setMyRegion: (region: string | null) => setProfile((p) => ({ ...p, myRegion: region })),
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
