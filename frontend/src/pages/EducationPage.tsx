import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Eye, Clock } from "lucide-react";
import { fetchEducationLectures, getMyTypeEducation, EDU_TOPIC_LABELS, EDU_TOPIC_ORDER } from "../api/education";
import type { EducationLecture } from "../api/education";
import { STARTUP_TYPES_BY_KEY } from "../data/startupTypes";
import { useAppState } from "../state/AppState";
import { Pagination } from "../components/Pagination";
import { LoginLocked } from "../components/LoginLocked";
import "./EducationPage.css";

type SortKey = "views" | "recent";
type TabKey = "myType" | "all";

const PAGE_SIZE = 9;

const TABS: { key: TabKey; label: string }[] = [
  { key: "myType", label: "맞춤 교육" },
  { key: "all", label: "전체 교육" },
];

export function EducationPage() {
  const { loggedIn, myType } = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("myType");
  const [lectures, setLectures] = useState<EducationLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState<SortKey>("views");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchEducationLectures()
      .then(setLectures)
      .finally(() => setLoading(false));
  }, []);

  const myTypeEducation = useMemo(
    () => (myType ? getMyTypeEducation(lectures, myType) : null),
    [lectures, myType],
  );

  const filtered = useMemo(() => {
    let list = lectures;
    if (topic) list = list.filter((l) => l.topicCode === topic);
    return [...list].sort((a, b) =>
      sort === "views" ? b.viewCount - a.viewCount : (b.regDate ?? "").localeCompare(a.regDate ?? ""),
    );
  }, [lectures, topic, sort]);

  useEffect(() => {
    setPage(1);
  }, [topic, sort, tab]);

  const activeList = tab === "myType" ? (myTypeEducation?.lectures ?? []) : filtered;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = activeList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="container edu-main">
      <h1>창업교육</h1>
      <p className="edu-sub">창업진흥원 창업에듀 영상으로 배우는 실전 지식</p>

      {loading ? (
        <div className="edu-loading">불러오는 중…</div>
      ) : (
        <>
          <div className="edu-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`edu-tab${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "myType" ? (
            !loggedIn ? (
              <LoginLocked desc="맞춤 교육을 보려면 로그인해주세요" />
            ) : myType && myTypeEducation ? (
              <section className="edu-recommend">
                <div className="edu-toolbar">
                  <h2 className="edu-recommend-title">
                    {myTypeEducation.isFallback ? (
                      "딱 맞는 추천이 없어 인기 강의를 보여드려요"
                    ) : (
                      <>
                        <span className="edu-recommend-title-point">{STARTUP_TYPES_BY_KEY[myType].name}</span>
                        에게 추천하는 교육
                      </>
                    )}
                  </h2>
                  <span className="edu-count">총 {myTypeEducation.lectures.length}건</span>
                </div>
                <div className="edu-grid">
                  {pageItems.map((l) => (
                    <EducationCard key={l.id} lecture={l} />
                  ))}
                </div>
                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
              </section>
            ) : (
              <div className="edu-prompt">
                <div className="edu-prompt-title">유형 검사하면 맞춤 교육을 볼 수 있어요</div>
                <button className="btn btn-primary edu-prompt-cta" onClick={() => navigate("/test")}>
                  검사 시작
                </button>
              </div>
            )
          ) : (
            <>
              <div className="edu-topics">
                <button className={`chip${topic === "" ? " active" : ""}`} onClick={() => setTopic("")}>
                  전체
                </button>
                {EDU_TOPIC_ORDER.map((code) => (
                  <button
                    key={code}
                    className={`chip${topic === code ? " active" : ""}`}
                    onClick={() => setTopic(code)}
                  >
                    {EDU_TOPIC_LABELS[code]}
                  </button>
                ))}
              </div>

              <div className="edu-toolbar">
                <span className="edu-count">총 {filtered.length}건</span>
                <div className="edu-sort-toggle">
                  <button className={sort === "views" ? "active" : ""} onClick={() => setSort("views")}>
                    조회수순
                  </button>
                  <button className={sort === "recent" ? "active" : ""} onClick={() => setSort("recent")}>
                    최신순
                  </button>
                </div>
              </div>

              <div className="edu-grid">
                {pageItems.map((l) => (
                  <EducationCard key={l.id} lecture={l} />
                ))}
              </div>

              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </>
      )}
    </main>
  );
}

function EducationCard({ lecture }: { lecture: EducationLecture }) {
  const body = (
    <>
      <div className="edu-card-top">
        <span className="badge badge-soft">{lecture.topicLabel}</span>
      </div>
      <h3 className="edu-card-title">{lecture.title}</h3>
      <p className="edu-card-summary">{lecture.summary}</p>
      <div className="edu-card-meta">
        <span>
          <Clock size={13} /> 약 {lecture.minutes}분
        </span>
        <span>
          <Eye size={13} /> {lecture.viewCount.toLocaleString("ko-KR")}
        </span>
        <span className="edu-card-play">
          <PlayCircle size={13} /> 보러가기
        </span>
      </div>
    </>
  );

  if (lecture.href) {
    return (
      <a className="edu-card card" href={lecture.href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }
  return <div className="edu-card card edu-card-static">{body}</div>;
}
