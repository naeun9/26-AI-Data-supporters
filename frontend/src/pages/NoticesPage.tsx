import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { getNotices } from "../api/client";
import { STAGE_GROUPS } from "../api/kised";
import { useAppState } from "../state/AppState";
import { NoticeRow } from "../components/NoticeRow";
import { LoginLocked } from "../components/LoginLocked";
import type { Notice } from "../types";
import "./NoticesPage.css";

type TabKey = "all" | "matched" | "soon" | "bookmarked";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "전체 공고" },
  { key: "soon", label: "마감임박" },
  { key: "matched", label: "내 맞춤" },
  { key: "bookmarked", label: "북마크" },
];

const PAGE_SIZE = 15;
const CHIP_GROUP_SIZE = 10;

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const groupStart = Math.floor((page - 1) / CHIP_GROUP_SIZE) * CHIP_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + CHIP_GROUP_SIZE - 1, totalPages);
  const chips = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  const showLastPage = groupEnd < totalPages;

  return (
    <nav className="notices-pagination" aria-label="페이지 네비게이션">
      <button
        className="notices-page-arrow"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft size={16} />
      </button>
      {chips.map((p) => (
        <button
          key={p}
          className={`notices-page-btn${p === page ? " active" : ""}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      {showLastPage && (
        <>
          <span className="notices-page-ellipsis">…</span>
          <button
            className="notices-page-btn"
            onClick={() => onChange(totalPages)}
            aria-label={`마지막 페이지 (${totalPages})`}
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        className="notices-page-arrow"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

export function NoticesPage() {
  const { loggedIn, unlocked, myType, bookmarks } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) ?? "all";
  const locked = (tab === "matched" || tab === "bookmarked") && !loggedIn;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [region, setRegion] = useState("");
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState<"soon" | "recent">("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getNotices(unlocked && myType ? { type: myType } : undefined).then(setNotices);
  }, [unlocked, myType]);

  const regions = useMemo(
    () =>
      Array.from(new Set(notices.map((n) => n.region)))
        .filter((r) => r !== "전국")
        .sort((a, b) => a.localeCompare(b, "ko")),
    [notices],
  );

  const filtered = useMemo(() => {
    let list = notices;
    if (tab === "matched") list = list.filter((n) => n.recommended);
    if (tab === "soon") list = list.filter((n) => n.urgency !== "none");
    if (tab === "bookmarked") list = list.filter((n) => bookmarks.includes(n.id));
    if (region) list = list.filter((n) => n.region === region);
    if (stage) list = list.filter((n) => n.stage === stage);
    return [...list].sort((a, b) => (sort === "soon" ? a.ddayNum - b.ddayNum : b.ddayNum - a.ddayNum));
  }, [notices, tab, region, stage, sort, bookmarks]);

  useEffect(() => {
    setPage(1);
  }, [tab, region, stage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function setTab(next: TabKey) {
    setSearchParams(next === "all" ? {} : { tab: next });
  }

  return (
    <main className="container notices-main">
      <h1>지원공고</h1>
      <p className="notices-sub">창업진흥원 K-Startup 공고를 한눈에</p>

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

      {!locked && <div className="notices-count">총 {filtered.length}건</div>}

      {!locked && (
        <div className="notices-filters">
          <label className="filter-select-wrap">
            <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as "soon" | "recent")}>
              <option value="recent">최신순</option>
              <option value="soon">마감임박순</option>
            </select>
            <ChevronDown size={15} className="filter-select-icon" />
          </label>
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
          <div style={{ flex: 1 }} />
        </div>
      )}

      {locked ? (
        <LoginLocked
          desc={
            tab === "bookmarked"
              ? "북마크한 공고를 보려면 로그인해주세요"
              : "내 유형에 맞는 공고를 보려면 로그인해주세요"
          }
        />
      ) : (
        <>
          <div className="notices-list">
            {pageItems.map((n) => (
              <NoticeRow key={n.id} notice={n} showRecommended={tab === "all" || tab === "matched"} />
            ))}
          </div>

          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

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
    </main>
  );
}
