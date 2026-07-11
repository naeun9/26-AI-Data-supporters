import { useEffect, useRef, useState } from "react";
import { getDashboard } from "../api/client";
import type { DashboardData } from "../api/client";
import { DonutChart } from "../components/DonutChart";
import { StackedBar } from "../components/StackedBar";
import "./DashboardPage.css";

const SECTIONS = [
  { id: "dsec0", label: "개요" },
  { id: "dsec1", label: "업종 분포" },
  { id: "dsec2", label: "창업자 정보" },
  { id: "dsec3", label: "준비 기간 / 연차별 분포" },
];

const RANK_STYLES = [
  { border: "#c7d6f5", numColor: "#3b6fe0", numOutline: false, valColor: "#3b6fe0" },
  { border: "#e8eaed", numColor: "rgba(57,64,82,0.13)", numOutline: true, valColor: "#1a1d23" },
  { border: "#e8eaed", numColor: "rgba(57,64,82,0.13)", numOutline: true, valColor: "#1a1d23" },
];

/** 진한 색일수록 값이 큼 (막대 위치가 아니라 값 순위로 색을 매김). */
const PREP_PAL = ["#254a9e", "#3b6fe0", "#6f9bf0", "#84a9f2", "#a9c5f7"];
const AGE_PAL = ["#1e3a7a", "#274fb0", "#3b6fe0", "#5b8def", "#84a9f2", "#a9c5f7", "#cbdcfa"];

/** 절대 기업수를 "105.1만" 형태로 표시 (막대 라벨 공간이 좁아서). */
function formatCompanies(n: number): string {
  return `${(n / 10000).toFixed(1)}만`;
}

/**
 * 막대 높이(%)를 0 기준이 아니라 [최솟값..최댓값] 구간을 floor~100%로 늘려서 계산.
 * 값들이 서로 근접할 때(예: 9.5~11.2) 막대가 다 거의 같은 높이로 뭉쳐 보이는 걸 막는다.
 * 실제 수치는 막대 위 라벨에 항상 그대로 표시되므로 왜곡이 아니라 가독성 조정.
 */
function scaledHeight(value: number, values: number[], floor = 20): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 100;
  return floor + ((value - min) / (max - min)) * (100 - floor);
}

function splitUnit(value: string) {
  const match = value.match(/^([\d.]+)(.*)$/);
  if (!match) return value;
  const [, num, unit] = match;
  return unit ? (
    <>
      {num}
      <span className="dash-stat-unit">{unit}</span>
    </>
  ) : (
    num
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [active, setActive] = useState(SECTIONS[0].id);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDashboard().then(setData);
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { root, threshold: 0.5 },
    );
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setRevealed((prev) => {
            if (prev.has(entry.target.id)) return prev;
            const next = new Set(prev);
            next.add(entry.target.id);
            return next;
          });
        });
      },
      { root, threshold: 0.2 },
    );
    SECTIONS.forEach((s) => {
      const el = refs.current[s.id];
      if (el) {
        observer.observe(el);
        revealObserver.observe(el);
      }
    });
    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, [data]);

  if (!data) return <main className="dash-loading">불러오는 중…</main>;

  function reveal(id: string, delay = 0, baseClass = "") {
    const isIn = revealed.has(id);
    return {
      className: `${baseClass ? baseClass + " " : ""}dash-reveal${isIn ? " in" : ""}`,
      style: { transitionDelay: `${delay}ms` },
    };
  }

  return (
    <main id="dashScroll" className="dash-scroll" ref={scrollerRef}>
      <nav className="dash-dotnav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className="dash-dotnav-item"
            onClick={() => refs.current[s.id]?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className={`dash-dotnav-label${active === s.id ? " active" : ""}`}>{s.label}</span>
            <span className={`dash-dotnav-dot${active === s.id ? " active" : ""}`} />
          </button>
        ))}
      </nav>

      {/* 화면 1: 히어로 + 핵심 지표 */}
      <section
        id="dsec0"
        ref={(el) => {
          refs.current.dsec0 = el;
        }}
        className="dash-section dash-hero"
      >
        <svg className="dash-hero-bg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="none" stroke="#3b6fe0" opacity=".08">
            <circle cx="50%" cy="44%" r="170" />
            <circle cx="50%" cy="44%" r="290" />
            <circle cx="50%" cy="44%" r="420" />
          </g>
        </svg>
        <div {...reveal("dsec0", 0, "dash-hero-content")}>
          <span className="dash-live-badge">
            <span className="dash-live-dot" /> K-STARTUP · LIVE DATA
          </span>
          <h1>창업 현황</h1>
          <p>
            창업진흥원 공공데이터로 본 국내 창업 생태계&nbsp;
            <span className="dash-accent">스크롤</span>하며 살펴보세요.
          </p>
        </div>
        <div {...reveal("dsec0", 140, "dash-stat-strip")}>
          <div className="dash-stat-item">
            <div className="dash-stat-value">{splitUnit(data.statStrip[0]?.value ?? "")}</div>
            <div className="dash-stat-label">업종 분류</div>
          </div>
          <div className="dash-stat-item">
            <div className="dash-stat-value">{splitUnit(data.statStrip[1]?.value ?? "")}</div>
            <div className="dash-stat-label">평균 준비기간</div>
          </div>
          <div className="dash-stat-item">
            <div className="dash-stat-value">
              {data.corpVsIndividual.individual.toFixed(0)}
              <span className="dash-stat-value-sub"> : </span>
              {data.corpVsIndividual.corporate.toFixed(0)}
            </div>
            <div className="dash-stat-label">개인 vs 법인 (%)</div>
          </div>
        </div>
        <div className="dash-scroll-cue">
          <span>SCROLL</span>
          <span>↓</span>
        </div>
      </section>

      {/* 화면 2: 업종별 분포 */}
      <section
        id="dsec1"
        ref={(el) => {
          refs.current.dsec1 = el;
        }}
        className="dash-section"
      >
        <div {...reveal("dsec1", 0, "dash-section-head")}>
          <h2>어떤 분야에서 창업이 활발할까요?</h2>
          <p>업종별 창업 기업 분포</p>
        </div>
        <div {...reveal("dsec1", 60, "dash-rank-grid")}>
          {data.industryDistribution.slice(0, 3).map((r, i) => (
            <div key={r.industry} className="dash-rank-card" style={{ borderColor: RANK_STYLES[i].border }}>
              <span
                className={`dash-rank-num${RANK_STYLES[i].numOutline ? " outline" : ""}`}
                style={{ color: RANK_STYLES[i].numColor }}
              >
                {i + 1}
              </span>
              <div className="dash-rank-body">
                <div className="dash-rank-top">TOP {i + 1}</div>
                <div className="dash-rank-name">{r.industry}</div>
                <div className="dash-rank-val" style={{ color: RANK_STYLES[i].valColor }}>
                  {r.share.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <div {...reveal("dsec1", 120, "dash-panel")}>
          <div className="dash-dist-list">
            {data.industryDistribution.map((r) => (
              <div key={r.industry} className="dash-dist-row">
                <span className="dash-dist-name">{r.industry}</span>
                <span className="dash-dist-track">
                  <span
                    className="dash-dist-fill"
                    style={{
                      width: `${(r.share / data.industryDistribution[0].share) * 100}%`,
                      transform: `scaleX(${revealed.has("dsec1") ? 1 : 0})`,
                    }}
                  />
                </span>
                <span className="dash-dist-val">{r.share.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-scroll-cue">
          <span>SCROLL</span>
          <span>↓</span>
        </div>
      </section>

      {/* 화면 3: 학력 + 창업자 구성 */}
      <section
        id="dsec2"
        ref={(el) => {
          refs.current.dsec2 = el;
        }}
        className="dash-section"
      >
        <div {...reveal("dsec2", 0, "dash-section-head")}>
          <h2>어떤 사람들이 창업을 할까요?</h2>
          <p>학력 · 성별 · 취업상태</p>
        </div>
        <div className="dash-panel-split">
          <div {...reveal("dsec2", 60, "dash-card")}>
            <div className="dash-card-title">창업자 학력 분포</div>
            <div className="dash-card-sub">업종별 기업수 가중평균</div>
            <div className="dash-donut-row">
              <DonutChart
                a={data.education.gradOrAbove}
                b={data.education.belowGrad}
                labelA="대졸 이상"
                labelB="고졸 이하"
                revealed={revealed.has("dsec2")}
              />
            </div>
          </div>
          <div {...reveal("dsec2", 150, "dash-card")}>
            <div className="dash-card-title">창업자 구성</div>
            <div className="dash-card-sub">성별 · 창업 전 취업상태</div>
            <div className="dash-stacked-group">
              <StackedBar
                label="성별"
                a={data.gender.male}
                b={data.gender.female}
                labelA="남성"
                labelB="여성"
                revealed={revealed.has("dsec2")}
              />
              <StackedBar
                label="창업 전 취업상태"
                a={data.employment.employed}
                b={data.employment.notEmployed}
                labelA="취업 상태"
                labelB="취업 경험 없음"
                emphasis
                revealed={revealed.has("dsec2")}
              />
            </div>
          </div>
        </div>
        <div className="dash-scroll-cue">
          <span>SCROLL</span>
          <span>↓</span>
        </div>
      </section>

      {/* 화면 4: 준비기간 상세 + 업력별 분포 */}
      <section
        id="dsec3"
        ref={(el) => {
          refs.current.dsec3 = el;
        }}
        className="dash-section"
      >
        <div {...reveal("dsec3", 0, "dash-section-head")}>
          <h2>창업 준비기간과 연차별 기업 수는 어떻게 될까요?</h2>
          <p>준비기간 · 창업 연차별 생존 분포</p>
        </div>
        <div className="dash-prep-grid">
          <div {...reveal("dsec3", 60, "dash-card")}>
            <div className="dash-card-title">연령대별 창업 준비기간(평균 준비 개월)</div>
            <div className="dash-card-sub">단위 · 개월</div>
            <div className="dash-bar-chart">
              {(() => {
                const months = data.prepByAgeGroup.map((p) => p.months);
                const rankByLabel = new Map(
                  [...data.prepByAgeGroup]
                    .sort((a, b) => b.months - a.months)
                    .map((r, rank) => [r.label, rank]),
                );
                return data.prepByAgeGroup.map((r) => {
                  const isMax = (rankByLabel.get(r.label) ?? 0) === 0;
                  return (
                    <div key={r.label} className="dash-bar-col">
                      <span className={`dash-bar-val ink${isMax ? " max" : ""}`}>{r.months.toFixed(1)}</span>
                      <span
                        className="dash-bar-fill prep"
                        style={{
                          background: PREP_PAL[rankByLabel.get(r.label) ?? 0],
                          height: `${scaledHeight(r.months, months, 45)}%`,
                          transform: `scaleY(${revealed.has("dsec3") ? 1 : 0})`,
                        }}
                      />
                      <span className={`dash-bar-label${isMax ? " max" : ""}`}>{r.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          <div {...reveal("dsec3", 150, "dash-card")}>
            <div className="dash-card-title">창업 연차별 기업 분포</div>
            <div className="dash-card-sub">1~7년차 기업 수</div>
            <div className="dash-bar-chart">
              {(() => {
                const companies = data.ageDistribution.map((a) => a.companies);
                return data.ageDistribution.map((r, i) => (
                  <div key={r.label} className="dash-bar-col">
                    <span className="dash-bar-val">{formatCompanies(r.companies)}</span>
                    <span
                      className="dash-bar-fill"
                      style={{
                        background: AGE_PAL[i],
                        height: `${scaledHeight(r.companies, companies)}%`,
                        transform: `scaleY(${revealed.has("dsec3") ? 1 : 0})`,
                      }}
                    />
                    <span className="dash-bar-label">{r.label}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
