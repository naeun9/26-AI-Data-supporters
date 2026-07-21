import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, BarChart3 } from "lucide-react";
import { MiniHeader } from "../components/MiniHeader";
import { TypeIcon } from "../icons/TypeIcon";
import { NoticeCard } from "../components/NoticeCard";
import { useAppState } from "../state/AppState";
import { getType, recommend } from "../api/client";
import type { Notice, StartupType } from "../types";
import "./ResultPage.css";

export function ResultPage() {
  const navigate = useNavigate();
  const { myType, resetTest } = useAppState();
  const [type, setType] = useState<StartupType | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!myType) {
      navigate("/test");
      return;
    }
    let cancelled = false;
    async function load() {
      const [t, rec] = await Promise.all([getType(myType!), recommend({ type: myType!, limit: 2 })]);
      if (cancelled) return;
      setType(t);
      setNotices(rec.notices);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [myType, navigate]);

  if (!type) return null;

  return (
    <div>
      <MiniHeader
        title="검사 결과"
        sticky
        blurred
        maxWidth={760}
        right={
          <button
            className="btn btn-ghost"
            onClick={() => {
              resetTest();
              navigate("/test");
            }}
          >
            <RotateCcw size={15} /> 다시하기
          </button>
        }
      />
      <main className="result-main">
        <div className="result-hero">
          <span className="result-icon-halo">
            <TypeIcon type={type.key} size={64} />
          </span>
          <div className="result-eyebrow">당신의 창업 유형</div>
          <h1>{type.name}</h1>
          <p>{type.desc}</p>
        </div>

        <div className="result-data-card">
          <div className="result-data-head">
            <BarChart3 size={17} color="var(--primary)" />
            <span className="result-data-title">데이터로 본 이 유형</span>
            <span className="result-data-sub">· 창업진흥원 통계</span>
          </div>
          <div className="result-data-grid">
            {type.data.map((d) => (
              <div key={d.label} className="result-data-item">
                <div className="result-data-value">{d.value}</div>
                <div className="result-data-label">{d.label}</div>
              </div>
            ))}
          </div>
          <div className="result-data-footnote">* {type.industryGroup} 기준 지표입니다</div>
        </div>

        <div className="result-3col">
          <div className="result-3col-item">
            <div className="result-3col-label">강점</div>
            <div className="result-3col-value">{type.strength}</div>
          </div>
          <div className="result-3col-item">
            <div className="result-3col-label">주의점</div>
            <div className="result-3col-value">{type.caution}</div>
          </div>
          <div className="result-3col-item">
            <div className="result-3col-label">추천 분야</div>
            <div className="result-3col-value">{type.field}</div>
          </div>
        </div>

        <div className="result-notices">
          <h2>이 유형에게 맞는 지원공고</h2>
          <div className="home-grid-2">
            {notices.map((n) => (
              <NoticeCard key={n.id} notice={n} />
            ))}
          </div>
          <div className="result-cta">
            <button className="btn btn-dark" onClick={() => navigate("/notices?tab=matched")}>
              맞춤 공고 전체 보기
            </button>
            <div className="result-cta-home">
              <button className="btn-text" onClick={() => navigate("/")}>
                홈으로
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
