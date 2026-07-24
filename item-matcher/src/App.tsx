import { useEffect, useMemo, useRef, useState } from "react";
import {
  API_BASE,
  fetchAnnouncementDetail,
  fetchAnnouncements,
  fetchGlobalOpportunities,
  fetchGoogleClientId,
  googleLoginApi,
  refreshAnnouncements,
} from "./api";
import type { GlobalOpportunity } from "./api";
import { Buddy, IDLE_LINE, THINKING_LINES, verdictLine } from "./Buddy";
import type { Mood } from "./Buddy";
import { DetailPanel, faviconUrl, shotUrl } from "./DetailPanel";
import { analyzeItem, focusPoint } from "./gemini";
import type { Analysis } from "./gemini";
import { getGoogleAccessToken } from "./google";
import {
  daysLeft,
  extractKeywords,
  formatDeadlineTime,
  matchWithKeywords,
  parseDeadlineTime,
} from "./matching";
import type { Announcement, AnnouncementDetail, MatchResult, Profile } from "./types";

/** 본문에서 URL만 파랗게 — textarea 뒤에 겹쳐 그리는 미러 레이어용 */
const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/g;

function highlightSegments(t: string) {
  return t.split(URL_SPLIT_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="url-hl">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const STORAGE_KEY = "matcher.profile";
const SAVED_KEY = "matcher.saved";
const MCP_GUIDE = "https://github.com/naeun9/26-AI-Data-supporters/tree/main/mcp-server";

/** 비로그인 무료 사용 한도 — 상위 2건만 노출, 검색 8회까지 */
const FREE_VISIBLE = 2;
const FREE_QUERIES = 8;

// localStorage + 쿠키 이중 기록 — 하나만 지워서는 초기화 안 되게
function readQuota(): number {
  const ls = Number(localStorage.getItem("matcher.quota") ?? "0") || 0;
  const ck = Number((document.cookie.match(/(?:^|; )mq=(\d+)/) ?? [])[1] ?? "0") || 0;
  return Math.max(ls, ck);
}

function bumpQuota(): number {
  const q = readQuota() + 1;
  localStorage.setItem("matcher.quota", String(q));
  document.cookie = `mq=${q};max-age=31536000;path=/;SameSite=Lax`;
  return q;
}

interface SavedItem {
  sn: number;
  title: string;
}

function loadSaved(): SavedItem[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as SavedItem[];
  } catch {
    return [];
  }
}

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

  // ── Gemini 분석: 링크까지 읽고 정확한 키워드/멘트를 뽑는다 (실패 시 로컬 폴백) ──
  const [llm, setLlm] = useState<{ forText: string; analysis: Analysis } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (debounced.trim().length < 8) {
      setAiBusy(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setAiBusy(true);
    analyzeItem(debounced, ctrl.signal)
      .then((a) => {
        if (ctrl.signal.aborted) return;
        if (a) setLlm({ forText: debounced, analysis: a });
        setAiBusy(false);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setAiBusy(false);
      });
    return () => ctrl.abort();
  }, [debounced]);

  const activeLlm = llm && llm.forText === debounced ? llm.analysis : null;

  const results = useMemo<MatchResult[]>(() => {
    if (!debounced.trim()) return [];
    const local = extractKeywords(debounced);
    const keywords = activeLlm
      ? Array.from(new Set([...activeLlm.keywords, ...local]))
      : local;
    return matchWithKeywords(keywords, filtered);
  }, [debounced, filtered, activeLlm]);
  const maxScore = results[0]?.score ?? 1;

  // ── 정렬 (기본: 마감 임박순) ──
  type SortMode = "deadline" | "relevance" | "newest" | "prize";
  const [sortMode, setSortMode] = useState<SortMode>("deadline");

  const sortedResults = useMemo(() => {
    const arr = [...results];
    if (sortMode === "deadline") {
      arr.sort((a, b) =>
        (a.notice.pbanc_rcpt_end_dt ?? "9999") < (b.notice.pbanc_rcpt_end_dt ?? "9999") ? -1 : 1,
      );
    } else if (sortMode === "newest") {
      arr.sort((a, b) =>
        (a.notice.pbanc_rcpt_bgng_dt ?? "") > (b.notice.pbanc_rcpt_bgng_dt ?? "") ? -1 : 1,
      );
    }
    // relevance/prize: matchWithKeywords 기본 정렬(관련도순) 유지 — 국내 공고엔 상금 데이터가 없음
    return arr;
  }, [results, sortMode]);

  // ── 공고 선택 → 상세 드로어 (미리보기 + 카운트다운 + 집중포인트) ──
  const [selected, setSelected] = useState<MatchResult | null>(null);
  const [selectedPinned, setSelectedPinned] = useState(false); // 저장함에서 연 경우
  const [detailMap, setDetailMap] = useState<Record<number, AnnouncementDetail>>({});
  const [focus, setFocus] = useState<{ sn: number; line: string } | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);

  // ── 로그인 게이팅: 비로그인은 상위 2건 + 무료 검색 횟수 제한 ──
  const [quota, setQuota] = useState(readQuota);
  const locked = !profile;
  const exhausted = locked && quota > FREE_QUERIES;

  useEffect(() => {
    if (!debounced.trim() || profile) return;
    setQuota(bumpQuota());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // ── 사업 저장함 ──
  const [saved, setSaved] = useState<SavedItem[]>(loadSaved);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  function toggleSave(r: MatchResult) {
    const sn = r.notice.pbanc_sn;
    setSaved((s) =>
      s.some((x) => x.sn === sn)
        ? s.filter((x) => x.sn !== sn)
        : [{ sn, title: r.notice.biz_pbanc_nm }, ...s].slice(0, 30),
    );
  }

  function openSaved(item: SavedItem) {
    const notice = announcements?.find((a) => a.pbanc_sn === item.sn);
    if (!notice) {
      setSaved((s) => s.filter((x) => x.sn !== item.sn));
      return;
    }
    setSelected({ notice, score: 0, matched: [] });
    setSelectedPinned(true);
  }

  // ── 실시간 동기화 티커 + 주기적 재수집 ──
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashSync(msg: string, ms = 3000) {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSyncNote(msg);
    syncTimer.current = setTimeout(() => setSyncNote(null), ms);
  }

  useEffect(() => {
    if (debounced.trim() && results.length > 0) flashSync(`↻ ${results.length}건 반영됨`, 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length, debounced]);

  useEffect(() => {
    const iv = setInterval(async () => {
      flashSync("공고 소스 동기화 중…", 6000);
      try {
        const prev = announcements?.length ?? 0;
        const fresh = await refreshAnnouncements();
        setAnnouncements(fresh);
        const diff = fresh.length - prev;
        flashSync(diff !== 0 ? `새 공고 ${Math.abs(diff)}건 반영됨` : "✓ 최신 상태", 3500);
      } catch {
        flashSync("동기화 실패 — 잠시 후 재시도", 3000);
      }
    }, 90_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements?.length]);

  // ── 글로벌 프로그램 (Devpost 등) ──
  const [globalOpps, setGlobalOpps] = useState<GlobalOpportunity[]>([]);

  useEffect(() => {
    fetchGlobalOpportunities().then(setGlobalOpps).catch(() => {});
  }, []);

  const globalMatchesRaw = useMemo(() => {
    if (!debounced.trim() || globalOpps.length === 0) return [];
    const enKeys =
      activeLlm?.keywords_en && activeLlm.keywords_en.length > 0
        ? activeLlm.keywords_en
        : (debounced.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []);
    if (enKeys.length === 0) return [];
    return globalOpps
      .map((g) => {
        const hay = `${g.title} ${g.themes.join(" ")} ${g.organization ?? ""}`.toLowerCase();
        const hit = enKeys.filter((k) => hay.includes(k));
        return { g, score: hit.length, hit };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [debounced, globalOpps, activeLlm]);

  const globalMatches = useMemo(() => {
    const arr = [...globalMatchesRaw];
    const days = (t: string | null | undefined) => {
      const m = t?.match(/(\d+)\s*day/);
      if (m) return Number(m[1]);
      return t?.includes("hour") || t?.includes("minute") ? 0 : 999;
    };
    const prize = (p: string) => Number((p.match(/[\d,]+/)?.[0] ?? "0").replace(/,/g, ""));
    if (sortMode === "deadline") {
      arr.sort((a, b) => days(a.g.deadline_text) - days(b.g.deadline_text));
    } else if (sortMode === "prize") {
      arr.sort((a, b) => prize(b.g.prize) - prize(a.g.prize));
    }
    return arr;
  }, [globalMatchesRaw, sortMode]);

  // 상위 결과 상세를 미리 받아 마감시각("오후 4시")을 리스트에도 표시
  useEffect(() => {
    for (const r of results.slice(0, 10)) {
      const sn = r.notice.pbanc_sn;
      fetchAnnouncementDetail(sn)
        .then((d) => {
          if (d) setDetailMap((m) => (m[sn] ? m : { ...m, [sn]: d }));
        })
        .catch(() => {});
    }
  }, [results]);

  // 사이트 스크린샷 프리로드 — 드로어를 열기 전에 미리 받아 즉시 뜨게
  const preloadedShots = useRef(new Set<string>());

  useEffect(() => {
    const targets = [
      ...results.slice(0, 8).map((r) => r.notice.detl_pg_url),
      ...saved
        .map((s) => announcements?.find((a) => a.pbanc_sn === s.sn)?.detl_pg_url)
        .slice(0, 5),
    ];
    // 검색 결과가 바뀌고 1초 뒤(입력이 잦아든 뒤)부터 순차 프리로드
    const timer = setTimeout(() => {
      for (const u of targets) {
        if (!u || preloadedShots.current.has(u)) continue;
        preloadedShots.current.add(u);
        const img = new Image();
        img.src = shotUrl(u);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [results, saved, announcements]);

  // 선택 공고가 결과에서 사라지면 패널 닫기 (저장함에서 연 경우는 유지)
  useEffect(() => {
    if (
      selected &&
      !selectedPinned &&
      !results.some((r) => r.notice.pbanc_sn === selected.notice.pbanc_sn)
    ) {
      setSelected(null);
    }
  }, [results, selected, selectedPinned]);

  // 선택하면 상세 로드 + AI 집중포인트 생성
  useEffect(() => {
    if (!selected) return;
    const sn = selected.notice.pbanc_sn;
    fetchAnnouncementDetail(sn)
      .then((d) => {
        if (d) setDetailMap((m) => (m[sn] ? m : { ...m, [sn]: d }));
        if (!d || focus?.sn === sn) return;
        setFocusBusy(true);
        focusPoint(debounced, d.biz_pbanc_nm, d.pbanc_ctnt ?? "")
          .then((line) => {
            if (line) setFocus({ sn, line });
          })
          .finally(() => setFocusBusy(false));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // ── 캐릭터 상태 머신: 입력 → 궁리(thinking) → 깨달음(eureka)/갸웃(puzzled) ──
  const [mood, setMood] = useState<Mood>("idle");
  const [line, setLine] = useState(IDLE_LINE);
  const [thinkingLine, setThinkingLine] = useState(THINKING_LINES[0]);
  const verdictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkIdx = useRef(0);
  const mirrorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      if (verdictTimer.current) clearTimeout(verdictTimer.current);
      setMood("idle");
      setLine(IDLE_LINE);
      return;
    }
    thinkIdx.current = (thinkIdx.current + 1) % THINKING_LINES.length;
    setThinkingLine(THINKING_LINES[thinkIdx.current]);
    setMood("thinking");
  }, [text]);

  useEffect(() => {
    if (!debounced.trim()) return;
    if (verdictTimer.current) clearTimeout(verdictTimer.current);
    const count = results.length;

    // Gemini 분석이 도착했으면 그 멘트를 바로 사용
    if (activeLlm) {
      setMood(count > 0 ? "eureka" : "puzzled");
      setLine(
        count > 0
          ? `${activeLlm.comment} 지금 모집 중인 ${count}건을 찾았어요!`
          : `${activeLlm.comment} ...그런데 조건에 맞는 모집 공고가 안 보이네요. 표현을 조금 바꿔볼까요?`,
      );
      return;
    }
    // 아직이면 잠시 궁리 후 로컬 분야 사전으로 폴백
    verdictTimer.current = setTimeout(() => {
      setMood(count > 0 ? "eureka" : "puzzled");
      setLine(verdictLine(debounced, count));
    }, 900);
    return () => {
      if (verdictTimer.current) clearTimeout(verdictTimer.current);
    };
  }, [debounced, results, activeLlm]);

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
          <span className="logo-mark">K</span>
          <span className="crumb" style={{ fontSize: 16, fontWeight: 800 }}>
            창업메이트
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

      <main className="page">
        <div className="page-head">
          <div className="page-icon">
            <Ic size={20}>
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
            </Ic>
          </div>
          <h1 className="page-title">
            아이템 매칭<span className="sub">· 실시간</span>
          </h1>
          <div className="page-actions">
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

            <div className="buddy-row">
              <Buddy mood={mood} />
              <div className="bubble" key={mood === "thinking" ? `t-${thinkingLine}` : line}>
                {mood === "thinking" ? (
                  <>
                    {thinkingLine}
                    <span className="dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  </>
                ) : (
                  line
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">아이템 설명</div>
              <div className="input-wrap">
                {!text.trim() && (
                  <div className="guide-box" aria-hidden="true">
                    <span className="guide-tag">✍ 여기에 아이템을 채워주세요</span>
                  </div>
                )}
                <div className="input-mirror" ref={mirrorRef} aria-hidden="true">
                  {highlightSegments(text)}
                  {"​"}
                </div>
                <textarea
                  className="idea-input"
                  placeholder={
                    "준비 중인 사업이나 아이템을 자유롭게 적어보세요. 회사/제품 링크를 붙여넣으면 내용까지 읽고 분석해요.\n\n예) AI 기반 의료 번역 서비스를 준비 중인 예비창업자예요. 모바일 앱으로 해외 환자와 병원을 연결하고 싶어요."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onScroll={(e) => {
                    if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
                  }}
                  autoFocus
                />
              </div>
              <div className="card-row">
                <span className="ic">{IconTag}</span> <span className="lbl">키워드 추출</span>
                <span className="right">
                  {(activeLlm?.keywords ?? liveKeywords).length > 0 ? (
                    (activeLlm?.keywords ?? liveKeywords).slice(0, 8).map((k) => (
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
                <span className="ic">{IconSpark}</span> <span className="lbl">AI 분석</span>
                {aiBusy ? (
                  <span className="right" style={{ color: "var(--amber)" }}>
                    <span className="dot amber" /> 분석 중…
                  </span>
                ) : activeLlm ? (
                  <span className="right status-green">
                    <span className="dot" /> {activeLlm.category || "분석 완료"}
                  </span>
                ) : (
                  <span className="right status-mut">대기 중</span>
                )}
              </div>
              <div className="card-row">
                <span className="ic">{IconDb}</span> <span className="lbl">공고 데이터</span>
                {dataStatus}
              </div>
              <div className="card-row">
                <span className="ic">{IconActivity}</span> <span className="lbl">실시간 매칭</span>
                <span className="right status-green">
                  <span className="dot" /> Active
                </span>
              </div>
            </div>

            {saved.length > 0 && (
              <>
                <span className="panel-label">저장한 사업</span>
                <div className="card saved-card">
                  {saved.map((s) => (
                    <button key={s.sn} className="saved-chip" onClick={() => openSaved(s)}>
                      <span className="saved-title">{s.title}</span>
                      <span
                        className="saved-x"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSaved((list) => list.filter((x) => x.sn !== s.sn));
                        }}
                      >
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

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
              {syncNote && <span className="sync-note">{syncNote}</span>}
            </div>

            {results.length > 0 && (
              <div className="sort-row">
                {(
                  [
                    ["deadline", "마감 임박순"],
                    ["relevance", "관련도순"],
                    ["newest", "최신 등록순"],
                    ["prize", "상금 높은순"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    className={`sort-chip${sortMode === k ? " active" : ""}`}
                    onClick={() => setSortMode(k)}
                    title={k === "prize" ? "상금 정보가 있는 글로벌 프로그램 기준" : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

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
                {sortedResults.map((r, i) => {
                  const sn = r.notice.pbanc_sn;
                  const d = daysLeft(r.notice.pbanc_rcpt_end_dt);
                  const dt = detailMap[sn] ? parseDeadlineTime(detailMap[sn].pbanc_ctnt) : null;
                  const kws = r.matched.slice(0, 4);
                  const isSel = selected?.notice.pbanc_sn === sn;
                  const isLocked = locked && (exhausted || i >= FREE_VISIBLE);
                  const icon = faviconUrl(r.notice.detl_pg_url, 32);
                  return (
                    <div key={sn} style={{ display: "contents" }}>
                      {locked && !exhausted && i === FREE_VISIBLE && (
                        <div className="unlock-card">
                          <div className="unlock-title">
                            🔒 나머지 {results.length - FREE_VISIBLE}건은 로그인하면 전부 보여요
                          </div>
                          <button className="btn primary" onClick={handleGoogleLogin} disabled={authBusy}>
                            <GoogleIcon /> 구글로 3초 로그인하고 전부 확인하기
                          </button>
                        </div>
                      )}
                      {locked && exhausted && i === 0 && (
                        <div className="unlock-card">
                          <div className="unlock-title">
                            🔒 무료 미리보기를 다 썼어요 — 로그인하면 계속 쓸 수 있어요
                          </div>
                          <button className="btn primary" onClick={handleGoogleLogin} disabled={authBusy}>
                            <GoogleIcon /> 구글로 3초 로그인
                          </button>
                        </div>
                      )}
                      <div
                        className={`result-card${isSel ? " selected" : ""}${isLocked ? " locked-card" : ""}`}
                        style={{ "--i": i } as React.CSSProperties}
                        onClick={() => {
                          if (isLocked) return;
                          setSelectedPinned(false);
                          setSelected(isSel ? null : r);
                        }}
                        role="button"
                        tabIndex={isLocked ? -1 : 0}
                        aria-hidden={isLocked}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isLocked) {
                            setSelectedPinned(false);
                            setSelected(isSel ? null : r);
                          }
                        }}
                      >
                        <div className="result-top">
                          {icon && <img className="result-favicon" src={icon} alt="" />}
                          <span className="result-title">{r.notice.biz_pbanc_nm}</span>
                          {d !== null && (
                            <span className={`dday${d <= 7 ? " urgent" : ""}`}>
                              {d === 0 ? "오늘 마감" : `D-${d}`}
                              {dt && ` (${formatDeadlineTime(dt)})`}
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
                    </div>
                  );
                })}
              </div>
            )}

            {/* 글로벌 프로그램 (Devpost 등) */}
            {globalMatches.length > 0 && (
              <>
                <div className="results-head" style={{ marginTop: 8 }}>
                  <span className="panel-label" style={{ padding: 0 }}>
                    🌐 글로벌 프로그램
                  </span>
                  <span className="count">{globalMatches.length}</span>
                </div>
                <div className="result-list">
                  {globalMatches.map(({ g, hit }, i) => (
                    <a
                      key={g.id}
                      className="result-card global-card"
                      style={{ "--i": i } as React.CSSProperties}
                      href={g.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {g.thumbnail && <img className="global-thumb" src={g.thumbnail} alt="" />}
                      <div className="global-body">
                        <div className="result-top">
                          <span className="result-title">{g.title}</span>
                          <span className="source-badge">{g.source}</span>
                        </div>
                        <div className="result-meta">
                          {[g.organization, g.location, g.deadline_text, g.prize && `상금 ${g.prize}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        <div className="why-chips" style={{ marginTop: 7 }}>
                          {hit.slice(0, 4).map((k) => (
                            <span key={k} className="chip green">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          {selected && (
            <DetailPanel
              sel={selected}
              detail={detailMap[selected.notice.pbanc_sn] ?? null}
              focus={focus?.sn === selected.notice.pbanc_sn ? focus.line : null}
              focusBusy={focusBusy}
              saved={saved.some((s) => s.sn === selected.notice.pbanc_sn)}
              onToggleSave={() => toggleSave(selected)}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>창업메이트 © 2026 · Crafted by AI 서포터즈</span>
          <span className="links">
            <a href="https://www.k-startup.go.kr" target="_blank" rel="noreferrer">
              K-Startup
            </a>
            <a href={`${API_BASE}/api/announcement/open`} target="_blank" rel="noreferrer">
              API
            </a>
            <a href={MCP_GUIDE} target="_blank" rel="noreferrer">
              MCP 연동
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}

/** 얇은 라인 아이콘 (lucide 스타일, stroke = currentColor) */
function Ic({ children, size = 15 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const IconTag = (
  <Ic>
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z" />
    <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
  </Ic>
);

const IconDb = (
  <Ic>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </Ic>
);

const IconActivity = (
  <Ic>
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  </Ic>
);

const IconSpark = (
  <Ic>
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M12 8.5 13.4 10.6 15.5 12 13.4 13.4 12 15.5 10.6 13.4 8.5 12 10.6 10.6Z" />
  </Ic>
);

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
