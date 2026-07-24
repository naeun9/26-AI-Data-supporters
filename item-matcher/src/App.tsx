import { useEffect, useMemo, useState } from "react";
import { API_BASE, fetchAnnouncements, fetchGoogleClientId, googleLoginApi } from "./api";
import { getGoogleAccessToken } from "./google";
import { daysLeft, extractKeywords, matchAnnouncements } from "./matching";
import type { Announcement, Profile } from "./types";

const STORAGE_KEY = "matcher.profile";
const MAIN_SITE = "https://26-ai-data-supporters.vercel.app";

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(loadProfile);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [region, setRegion] = useState("");
  const [stage, setStage] = useState("");

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setLoadError("공고 데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요."));
  }, []);

  // 실시간 매칭 — 입력 후 250ms 디바운스
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 250);
    return () => clearTimeout(t);
  }, [text]);

  const regions = useMemo(() => {
    if (!announcements) return [];
    const set = new Set<string>();
    for (const n of announcements) {
      if (n.supt_regin && n.supt_regin !== "전국") set.add(n.supt_regin);
    }
    return Array.from(set).sort();
  }, [announcements]);

  const stages = useMemo(() => {
    if (!announcements) return [];
    const set = new Set<string>();
    for (const n of announcements) if (n.biz_enyy) set.add(n.biz_enyy);
    return Array.from(set).sort();
  }, [announcements]);

  const filtered = useMemo(() => {
    if (!announcements) return [];
    return announcements.filter((n) => {
      if (region && !(n.supt_regin ?? "").includes(region) && n.supt_regin !== "전국") return false;
      if (stage && !(n.biz_enyy ?? "").includes(stage)) return false;
      return true;
    });
  }, [announcements, region, stage]);

  const liveKeywords = useMemo(() => extractKeywords(text), [text]);

  const { results } = useMemo(
    () => matchAnnouncements(debounced, filtered),
    [debounced, filtered],
  );
  const maxScore = results[0]?.score ?? 1;

  async function handleGoogleLogin() {
    if (authBusy) return;
    setAuthError(null);
    setAuthBusy(true);
    try {
      const clientId = await fetchGoogleClientId();
      if (!clientId) throw new Error("구글 로그인이 아직 설정되지 않았어요.");
      const accessToken = await getGoogleAccessToken(clientId);
      const p = await googleLoginApi(accessToken);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      setProfile(p);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "구글 로그인에 실패했어요.");
    } finally {
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }

  const dataStatus = loadError ? (
    <span className="right" style={{ color: "var(--red)" }}>
      <span className="dot red" /> 연결 오류
    </span>
  ) : announcements ? (
    <span className="right status-green">
      <span className="dot" /> {announcements.length}건 로드됨
    </span>
  ) : (
    <span className="right" style={{ color: "var(--amber)" }}>
      <span className="dot amber" /> 불러오는 중…
    </span>
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="logo-mark" href={MAIN_SITE} title="창업메이트 홈">
            K
          </a>
          <a className="crumb" href={MAIN_SITE}>
            <span className="crumb-badge k">K</span> 창업메이트
          </a>
          <span className="crumb-sep">/</span>
          <span className="crumb">
            <span className="crumb-badge m">M</span> 아이템 매칭
          </span>
          <span className="live-pill">
            <span className="dot" /> 실시간 매칭
          </span>

          <div className="topbar-right">
            {profile ? (
              <div className="user-chip">
                <span className="avatar">{profile.nickname.slice(0, 1)}</span>
                <span>{profile.nickname} 님</span>
                <button className="link-mut" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            ) : (
              <button className="btn" onClick={handleGoogleLogin} disabled={authBusy}>
                <GoogleIcon />
                {authBusy ? "로그인 중…" : "Google로 로그인"}
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="tabs">
        <div className="tabs-inner">
          <span className="tab active">매칭</span>
          <a className="tab" href={`${MAIN_SITE}/notices`}>
            지원공고
          </a>
          <a className="tab" href={`${MAIN_SITE}/chat`}>
            챗봇
          </a>
          <a className="tab" href={`${MAIN_SITE}/test`}>
            유형검사
          </a>
          <a className="tab" href={`${MAIN_SITE}/dashboard`}>
            창업 현황
          </a>
        </div>
      </nav>

      <main className="page">
        <div className="page-head">
          <div className="page-icon">⚡</div>
          <h1 className="page-title">
            아이템 매칭<span className="sub">· 실시간</span>
          </h1>
          <div className="page-actions">
            <a className="btn" href={MAIN_SITE}>
              창업메이트 홈
            </a>
            <a className="btn primary" href="https://www.k-startup.go.kr" target="_blank" rel="noreferrer">
              K-Startup ↗
            </a>
          </div>
        </div>

        {authError && <div className="err-banner">{authError}</div>}

        <div className="canvas">
          {/* ── 왼쪽: 입력 + 상태 ── */}
          <div className="col">
            <span className="panel-label">내 사업 · 아이템</span>

            <div className="card">
              <div className="card-head">
                <span className="ic">✏️</span> 아이템 설명
              </div>
              <textarea
                className="idea-input"
                placeholder={
                  "준비 중인 사업이나 아이템을 자유롭게 적어보세요.\n\n예) AI 기반 의료 번역 서비스를 준비 중인 예비창업자예요. 모바일 앱으로 해외 환자와 병원을 연결하고 싶어요."
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
              <div className="card-row">
                <span className="ic">🏷️</span> <span className="lbl">키워드 추출</span>
                <span className="right">
                  {liveKeywords.length > 0 ? (
                    liveKeywords.slice(0, 8).map((k) => (
                      <span key={k} className="chip">
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="status-mut">입력 대기</span>
                  )}
                </span>
              </div>
              <div className="card-row">
                <span className="ic">🗂️</span> <span className="lbl">공고 데이터</span>
                {dataStatus}
              </div>
              <div className="card-row">
                <span className="ic">⚙️</span> <span className="lbl">실시간 매칭</span>
                <span className="right status-green">
                  <span className="dot" /> Active
                </span>
              </div>
            </div>

            <span className="panel-label">매칭 필터</span>
            <div className="card">
              <div className="card-row">
                지역
                <span className="right">
                  <select className="filter" value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">전체 (전국 포함)</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
              <div className="card-row">
                창업 단계
                <span className="right">
                  <select className="filter" value={stage} onChange={(e) => setStage(e.target.value)}>
                    <option value="">전체</option>
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 실시간 매칭 결과 ── */}
          <div className="col">
            <div className="results-head">
              <span className="panel-label" style={{ padding: 0 }}>
                맞춤 지원 프로그램
              </span>
              {results.length > 0 && <span className="count">{results.length}</span>}
            </div>

            {results.length === 0 ? (
              <div className="empty-card">
                <div className="big">
                  {debounced.trim() ? "일치하는 공고를 찾지 못했어요" : "왼쪽에 아이템을 적어보세요"}
                </div>
                {debounced.trim()
                  ? "키워드를 바꾸거나 필터를 넓혀보세요."
                  : "입력하는 즉시 맞춤 지원사업이 여기에 실시간으로 나타나요."}
              </div>
            ) : (
              <div className="result-list">
                {results.map((r, i) => {
                  const d = daysLeft(r.notice.pbanc_rcpt_end_dt);
                  const kws = r.matched.slice(0, 4);
                  return (
                    <div className="result-card" key={r.notice.pbanc_sn} style={{ "--i": i } as React.CSSProperties}>
                      <div className="result-top">
                        <a
                          className="result-title"
                          href={r.notice.detl_pg_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.notice.biz_pbanc_nm}
                        </a>
                        {d !== null && (
                          <span className={`dday${d <= 7 ? " urgent" : ""}`}>
                            {d === 0 ? "오늘 마감" : `D-${d}`}
                          </span>
                        )}
                      </div>
                      <div className="result-meta">
                        {[r.notice.pbanc_ntrp_nm, r.notice.supt_biz_clsfc, r.notice.supt_regin]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      <div className="result-why">
                        <span className="dot" />
                        <span>
                          <span className="why-chips">
                            {kws.map((k) => (
                              <span key={k} className="chip green">
                                {k}
                              </span>
                            ))}
                          </span>
                          키워드가 일치해요 — <b>{r.matched.length}개 조건 매칭</b>
                          {r.matched.length > kws.length &&
                            ` (외 ${r.matched.length - kws.length}개)`}
                        </span>
                      </div>
                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{ width: `${Math.max(12, (r.score / maxScore) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>창업메이트 © 2026 · Crafted by AI 서포터즈</span>
          <span className="links">
            <a href={MAIN_SITE}>창업메이트</a>
            <a href="https://www.k-startup.go.kr" target="_blank" rel="noreferrer">
              K-Startup
            </a>
            <a href={`${API_BASE}/api/announcement/open`} target="_blank" rel="noreferrer">
              API
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.14-4.06 1.14-3.13 0-5.78-2.11-6.72-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.29a12 12 0 0 0 0 10.72l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.64l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}
