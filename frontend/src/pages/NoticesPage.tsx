import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Bookmark, Lock, Info, Check } from "lucide-react";
import { getNotices, getMatchedNotices } from "../api/client";
import type { MatchProfile } from "../api/client";
import { STAGE_GROUPS, INDUSTRY_OPTIONS } from "../api/kised";
import { STARTUP_TYPES_BY_KEY } from "../data/startupTypes";
import { useAppState } from "../state/AppState";
import { NoticeRow } from "../components/NoticeRow";
import { LoginLocked } from "../components/LoginLocked";
import { Pagination } from "../components/Pagination";
import { ProfileNudge } from "../components/ProfileNudge";
import type { Notice } from "../types";
import "./NoticesPage.css";

/** 맞춤 결과가 이 값 이하면 "조건을 넓히면 더 볼 수 있어요" 안내를 덧붙인다. */
const FEW_RESULTS_THRESHOLD = 8;

type TabKey = "all" | "matched" | "soon" | "bookmarked";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체 공고" },
  { key: "soon", label: "마감임박" },
  { key: "matched", label: "내 맞춤" },
  { key: "bookmarked", label: "북마크" },
];

const PAGE_SIZE = 15;

/** "내 맞춤" 결과가 0건일 때 — 조건 중 어떤 걸 빼면 몇 건이 나오는지 실제로 계산해서 안내(결과를 억지로 늘리지 않음). */
function MatchEmptyState({
  notices,
  profile,
  onViewAll,
}: {
  notices: Notice[];
  profile: MatchProfile;
  onViewAll: () => void;
}) {
  const relaxations: { label: string; count: number }[] = [];
  if (profile.region) {
    relaxations.push({ label: "지역", count: getMatchedNotices(notices, { ...profile, region: null }).length });
  }
  if (profile.stage) {
    relaxations.push({ label: "연차", count: getMatchedNotices(notices, { ...profile, stage: null }).length });
  }
  if (profile.type) {
    relaxations.push({ label: "유형", count: getMatchedNotices(notices, { ...profile, type: null }).length });
  }
  const best = relaxations.filter((r) => r.count > 0).sort((a, b) => b.count - a.count)[0];

  return (
    <div className="notices-empty">
      <div className="notices-empty-title">설정하신 조건에 딱 맞는 공고가 지금은 없어요</div>
      <div className="notices-empty-sub">
        {best ? `${best.label} 조건을 빼면 ${best.count}건을 볼 수 있어요` : "조건을 조정하거나 전체 공고를 확인해보세요"}
      </div>
      <button className="btn btn-primary notices-empty-cta" onClick={onViewAll}>
        전체 공고 보기
      </button>
    </div>
  );
}

export function NoticesPage() {
  const { loggedIn, unlocked, myType, myStage, myRegion, bookmarks } = useAppState();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) ?? "all";
  const locked = (tab === "matched" || tab === "bookmarked") && !loggedIn;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [age, setAge] = useState("");
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState<"soon" | "recent">("recent");
  const [page, setPage] = useState(1);
  // "내 맞춤" 축 on/off — 세션 한정 임시 상태. 프로필 저장값(localStorage)은 안 건드림.
  const [activeAxes, setActiveAxes] = useState({ type: true, stage: true, region: true });

  useEffect(() => {
    getNotices(unlocked && myType ? { type: myType } : undefined)
      .then(setNotices)
      .finally(() => setLoading(false));
  }, [unlocked, myType]);

  const regions = useMemo(
    () =>
      Array.from(new Set(notices.map((n) => n.region)))
        .filter((r) => r !== "전국")
        .sort((a, b) => a.localeCompare(b, "ko")),
    [notices],
  );

  // "내 맞춤" 탭 전용 — 프로필(유형/연차/지역) 기준 매칭. 지역/연차 수동 드롭다운과는 별개(그 결과 안에서 추가로 좁힘).
  const hasProfile = Boolean(myType || myStage || myRegion);

  // 배너의 축 토글 칩 — 설정된 축만 노출, 꺼진 축은 매칭에서 제외(프로필 원본 값은 그대로 둠).
  const axisChips: { key: "type" | "stage" | "region"; label: string }[] = [];
  if (myType && STARTUP_TYPES_BY_KEY[myType]) axisChips.push({ key: "type", label: STARTUP_TYPES_BY_KEY[myType].name });
  if (myStage) axisChips.push({ key: "stage", label: myStage });
  if (myRegion) axisChips.push({ key: "region", label: myRegion });
  const anyAxisActive = axisChips.some((a) => activeAxes[a.key]);

  const matchProfile: MatchProfile = {
    type: activeAxes.type ? myType : null,
    stage: activeAxes.stage ? myStage : null,
    region: activeAxes.region ? myRegion : null,
  };
  const matchedNotices = useMemo(() => {
    const profile: MatchProfile = {
      type: activeAxes.type ? myType : null,
      stage: activeAxes.stage ? myStage : null,
      region: activeAxes.region ? myRegion : null,
    };
    return anyAxisActive ? getMatchedNotices(notices, profile) : notices;
  }, [notices, anyAxisActive, activeAxes.type, activeAxes.stage, activeAxes.region, myType, myStage, myRegion]);

  // "내 맞춤" 탭은 배너의 축 토글이 그 역할을 대신하므로, 수동 필터는 정렬만 남기고 나머지는 숨긴다.
  const isMatchedTab = tab === "matched";

  const filtered = useMemo(() => {
    let list = tab === "matched" ? matchedNotices : notices;
    if (tab === "soon") list = list.filter((n) => n.urgency !== "none");
    if (tab === "bookmarked") list = list.filter((n) => bookmarks.includes(n.id));
    if (region && tab !== "matched") list = list.filter((n) => n.region === region);
    if (industry && tab !== "matched") list = list.filter((n) => n.industries.includes(industry));
    if (age === "youth" && tab !== "matched") list = list.filter((n) => n.youthTargeted);
    if (stage && tab !== "matched") list = list.filter((n) => n.stage === stage);
    const effectiveSort = tab === "soon" ? "soon" : sort;
    return [...list].sort((a, b) => (effectiveSort === "soon" ? a.ddayNum - b.ddayNum : b.ddayNum - a.ddayNum));
  }, [notices, matchedNotices, tab, region, industry, age, stage, sort, bookmarks]);

  useEffect(() => {
    setPage(1);
  }, [tab, region, industry, age, stage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 로그인은 했지만 유형/연차/지역 중 아무 것도 설정 안 한 상태 — "맞춤" 자체를 계산할 기준이 없음.
  const matchedNoProfile = tab === "matched" && !locked && !hasProfile;

  function setTab(next: TabKey) {
    setSearchParams(next === "all" ? {} : { tab: next });
  }

  return (
    <main className="container notices-main">
      <h1>지원공고</h1>
      <p className="notices-sub">창업진흥원 K-Startup 공고를 한눈에</p>

      {loading ? (
        <div className="notices-loading">지원공고 불러오는 중...</div>
      ) : (
        <>
          <div className="notices-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`notices-tab${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="notices-tab-label" data-label={t.label}>
                  <span className="notices-tab-label-text">{t.label}</span>
                </span>
                {t.key === "bookmarked" && (
                  <span className={`notices-tab-badge${tab === t.key ? "" : " idle"}`}>{bookmarks.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "matched" && !locked && !matchedNoProfile && axisChips.length > 0 && (
            <div className="notices-match-banner">
              <span className="notices-match-label">맞춤 기준</span>
              {axisChips.map((a) => (
                <button
                  key={a.key}
                  className={`chip notices-match-chip${activeAxes[a.key] ? " active" : ""}`}
                  onClick={() => setActiveAxes((prev) => ({ ...prev, [a.key]: !prev[a.key] }))}
                >
                  {activeAxes[a.key] && <Check size={13} />}
                  {a.label}
                </button>
              ))}
            </div>
          )}


          {tab === "matched" && !locked && !matchedNoProfile && (
            <ProfileNudge myStage={myStage} myRegion={myRegion} />
          )}

          {!locked && !matchedNoProfile && isMatchedTab && (
            <div className="notices-toolbar">
              <div className="notices-count">총 {filtered.length}건</div>
              <div className="notices-filters">
                <label className="filter-select-wrap">
                  <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as "soon" | "recent")}>
                    <option value="recent">최신순</option>
                    <option value="soon">마감임박순</option>
                  </select>
                  <ChevronDown size={15} className="filter-select-icon" />
                </label>
              </div>
            </div>
          )}

          {!locked && !matchedNoProfile && !isMatchedTab && (
            <>
              <div className="notices-count">총 {filtered.length}건</div>
              <div className="notices-filters">
                {tab !== "soon" && (
                  <label className="filter-select-wrap">
                    <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as "soon" | "recent")}>
                      <option value="recent">최신순</option>
                      <option value="soon">마감임박순</option>
                    </select>
                    <ChevronDown size={15} className="filter-select-icon" />
                  </label>
                )}
                <label className="filter-select-wrap">
                  <select className="filter-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">지역 전체</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="filter-select-icon" />
                </label>
                <label className="filter-select-wrap">
                  <select className="filter-select" value={age} onChange={(e) => setAge(e.target.value)}>
                    <option value="">전체 연령</option>
                    <option value="youth">청년 (만 39세 이하)</option>
                  </select>
                  <ChevronDown size={15} className="filter-select-icon" />
                </label>
                <label className="filter-select-wrap">
                  <select className="filter-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                    <option value="">전체 창업자 유형</option>
                    {STAGE_GROUPS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="filter-select-icon" />
                </label>
                <label className="filter-select-wrap filter-select-wrap-tagged">
                  <select className="filter-select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    <option value="">업종 전체</option>
                    {INDUSTRY_OPTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="filter-select-icon" />
                  <span
                    className="filter-select-info"
                    title="공고 제목·내용의 키워드로 저희가 자동 분류한 정보예요. K-Startup 원본 데이터가 아니라 실제와 다를 수 있어요."
                    aria-label="업종 분류 안내"
                  >
                    <Info size={14} />
                  </span>
                </label>
                <div style={{ flex: 1 }} />
              </div>
            </>
          )}

          {locked ? (
            <LoginLocked
              desc={
                tab === "bookmarked"
                  ? "북마크한 공고를 보려면 로그인해주세요"
                  : "내 유형에 맞는 공고를 보려면 로그인해주세요"
              }
            />
          ) : matchedNoProfile ? (
            <div className="login-locked">
              <span className="login-locked-icon">
                <Lock size={18} />
              </span>
              <div className="login-locked-title">아직 맞춤 조건이 없어요</div>
              <div className="login-locked-desc">유형 검사를 하거나 마이페이지에서 연차·지역을 설정하면 맞춤 공고를 볼 수 있어요</div>
              <div className="notices-empty-actions">
                <button className="btn btn-primary login-locked-cta" onClick={() => navigate("/test")}>
                  검사 시작
                </button>
                <button className="btn btn-ghost login-locked-cta" onClick={() => navigate("/my")}>
                  마이페이지로
                </button>
              </div>
            </div>
          ) : tab === "matched" && filtered.length === 0 ? (
            <MatchEmptyState notices={notices} profile={matchProfile} onViewAll={() => setTab("all")} />
          ) : (
            <>
              <div className="notices-list">
                {pageItems.map((n) => (
                  <NoticeRow key={n.id} notice={n} showRecommended={tab === "all" || tab === "matched"} />
                ))}
              </div>

              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

              {tab === "matched" && filtered.length <= FEW_RESULTS_THRESHOLD && (
                <div className="notices-hint">조건을 넓히면 더 많은 공고를 볼 수 있어요</div>
              )}

              {tab === "bookmarked" && filtered.length === 0 && (
                <div className="notices-empty">
                  <div className="notices-empty-icon">
                    <Bookmark size={24} />
                  </div>
                  <div className="notices-empty-title">아직 북마크한 공고가 없어요</div>
                  <div className="notices-empty-sub">관심 있는 공고의 북마크 아이콘을 눌러 저장하세요</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
