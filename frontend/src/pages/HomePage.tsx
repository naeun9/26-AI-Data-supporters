import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight, Lock } from "lucide-react";
import { useAppState } from "../state/AppState";
import { getNotices } from "../api/client";
import type { Notice } from "../types";
import { NoticeCard } from "../components/NoticeCard";
import { NoticeRow } from "../components/NoticeRow";
import { ProfileNudge } from "../components/ProfileNudge";
import "./HomePage.css";

const QUICK_CHIPS = [
  "예비창업자인데 뭐 신청할 수 있어?",
  "AI 기술 창업 지원사업 알려줘",
  "여성 창업 지원사업 있어?",
  "재도전 지원사업 찾아줘",
];

export function HomePage() {
  const { loggedIn, unlocked, myType, myStage, myRegion, showToast } = useAppState();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [matched, setMatched] = useState<Notice[]>([]);
  const [soon, setSoon] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const all = await getNotices(unlocked && myType ? { type: myType } : undefined);
        if (cancelled) return;
        setSoon([...all].sort((a, b) => a.ddayNum - b.ddayNum).slice(0, 4));
        if (unlocked) {
          setMatched(all.filter((n) => n.recommended).slice(0, 2));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [unlocked, myType]);

  function goAsk(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const target = `/chat?q=${encodeURIComponent(trimmed)}`;
    if (!loggedIn) {
      showToast("먼저 로그인해주세요");
      navigate("/login", { state: { from: target } });
      return;
    }
    navigate(target);
  }

  return (
    <main className="container home-main">
      <section className="home-hero">
        <h1>
          어떤 창업을 준비하세요?
          <br />
          <span className="home-hero-highlight">AI가 맞춤 지원사업</span>을 찾아드려요
        </h1>
        <p>창업진흥원 공공데이터 기반으로 현실성 있는 답변을 제공합니다.</p>

        <form
          className="home-hero-form"
          onSubmit={(e) => {
            e.preventDefault();
            goAsk(input);
          }}
        >
          <span className="home-hero-form-icon">
            <MessageCircle size={20} />
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='예: "AI 의료 서비스 예비창업자인데 뭐 신청해?"'
          />
          <button type="submit" className="btn btn-primary">
            AI에게 묻기 <ArrowRight size={17} />
          </button>
        </form>

        <div className="home-hero-chips">
          {QUICK_CHIPS.map((chip) => (
            <button key={chip} className="chip" onClick={() => goAsk(chip)}>
              {chip}
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>내 유형 맞춤 공고</h2>
          {unlocked && (
            <a
              href="/notices"
              onClick={(e) => {
                e.preventDefault();
                navigate("/notices?tab=matched");
              }}
              className="home-section-link"
            >
              전체 보기 →
            </a>
          )}
        </div>

        {unlocked ? (
          <>
            <ProfileNudge myStage={myStage} myRegion={myRegion} />
            <div className="home-grid-2">
              {matched.map((n) => (
                <NoticeCard key={n.id} notice={n} />
              ))}
            </div>
          </>
        ) : (
          <div className="locked-wrap">
            <div className="locked-skeleton">
              <div className="locked-skeleton-card">
                <div className="sk sk-badge" />
                <div className="sk sk-line-lg" />
                <div className="sk sk-line-md" />
                <div className="sk sk-line-sm" />
              </div>
              <div className="locked-skeleton-card">
                <div className="sk sk-badge" />
                <div className="sk sk-line-lg" />
                <div className="sk sk-line-md" />
                <div className="sk sk-line-sm" />
              </div>
            </div>
            <div className="locked-overlay">
              <span className="locked-icon">
                <Lock size={18} />
              </span>
              <div className="locked-title">유형 검사하고 맞춤 공고 받기</div>
              <button className="btn btn-primary locked-cta" onClick={() => navigate("/test")}>
                검사 시작
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>마감임박 공고</h2>
          <a
            href="/notices"
            onClick={(e) => {
              e.preventDefault();
              navigate("/notices");
            }}
            className="home-section-link"
          >
            전체 보기 →
          </a>
        </div>
        {!loading && (
          <div className="home-grid-2">
            {soon.map((n) => (
              <NoticeRow key={n.id} notice={n} variant="soon" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
