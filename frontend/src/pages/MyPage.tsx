import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useAppState } from "../state/AppState";
import { getNotices, getType } from "../api/client";
import { ALL_CAREER_PERIODS } from "../api/kised";
import { TypeIcon } from "../icons/TypeIcon";
import { BookmarkButton } from "../components/BookmarkButton";
import { LoginLocked } from "../components/LoginLocked";
import { urgencyBadgeClass } from "../components/urgency";
import type { Notice, StartupType } from "../types";
import "./MyPage.css";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function deadlineFromDday(ddayNum: number) {
  const d = new Date();
  d.setDate(d.getDate() + ddayNum);
  return `~${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function MyPage() {
  const {
    loggedIn,
    myType,
    testedAt,
    myStage,
    myRegion,
    setMyStage,
    setMyRegion,
    bookmarks,
    conversations,
    setActiveConversation,
  } = useAppState();
  const navigate = useNavigate();
  const [type, setType] = useState<StartupType | null>(null);
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [bookmarkedNotices, setBookmarkedNotices] = useState<Notice[]>([]);
  const [soonCount, setSoonCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);

  useEffect(() => {
    if (loggedIn && myType) getType(myType).then(setType);
  }, [loggedIn, myType]);

  useEffect(() => {
    if (!loggedIn) return;
    getNotices(myType ? { type: myType } : undefined).then((all) => {
      setAllNotices(all);
      setBookmarkedNotices(
        all.filter((n) => bookmarks.includes(n.id)).sort((a, b) => a.ddayNum - b.ddayNum),
      );
      setSoonCount(all.filter((n) => bookmarks.includes(n.id) && n.urgency !== "none").length);
      setMatchedCount(all.filter((n) => n.recommended).length);
    });
  }, [loggedIn, bookmarks, myType]);

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(allNotices.map((n) => n.region)))
        .filter((r) => r !== "전국")
        .sort((a, b) => a.localeCompare(b, "ko")),
    [allNotices],
  );

  if (!loggedIn) {
    return (
      <main className="container my-main">
        <LoginLocked desc="북마크한 공고와 맞춤 유형 정보를 보려면 로그인해주세요" />
      </main>
    );
  }

  return (
    <main className="container my-main">
      <div className="my-profile-card">
        <div className="my-profile-top">
          <span className="my-profile-avatar">{type ? <TypeIcon type={type.key} size={48} /> : null}</span>
          <div>
            <div className="my-profile-label">내 창업 유형</div>
            <div className="my-profile-name">{type ? type.name : "아직 검사 전이에요"}</div>
            {testedAt && <div className="my-profile-date">{formatDate(testedAt)} 검사 완료</div>}
            <div className="my-profile-meta">
              <label className="my-profile-meta-field">
                <span className="my-profile-meta-label">창업 연차</span>
                <span className="my-profile-meta-select-wrap">
                  <select
                    className="my-profile-meta-select"
                    value={myStage ?? ""}
                    onChange={(e) => setMyStage(e.target.value || null)}
                  >
                    <option value="">미설정</option>
                    {ALL_CAREER_PERIODS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="my-profile-meta-select-icon" />
                </span>
              </label>
              <label className="my-profile-meta-field">
                <span className="my-profile-meta-label">지역</span>
                <span className="my-profile-meta-select-wrap">
                  <select
                    className="my-profile-meta-select"
                    value={myRegion ?? ""}
                    onChange={(e) => setMyRegion(e.target.value || null)}
                  >
                    <option value="">미설정</option>
                    {regionOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="my-profile-meta-select-icon" />
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="my-profile-stats">
          <div className="my-stat-pill">
            <span className="my-stat-value">{bookmarks.length}</span>
            <span className="my-stat-label">북마크</span>
          </div>
          <div className="my-stat-pill hot">
            <span className="my-stat-value">{soonCount}</span>
            <span className="my-stat-label">마감임박</span>
          </div>
          <div className="my-stat-pill soft">
            <span className="my-stat-value">{matchedCount}</span>
            <span className="my-stat-label">유형 맞춤</span>
          </div>
        </div>
      </div>

      {type ? (
        <div className="my-type-card">
          <div className="my-type-card-row">
            <div className="my-type-card-main">
              <div className="my-type-card-title">유형 프로필</div>
              <p>{type.desc}</p>
              <div className="my-type-tags">
                <span className="my-type-tag strength">강점 · {type.strength}</span>
                <span className="my-type-tag">주의 · {type.caution}</span>
                <span className="my-type-tag">추천 · {type.field}</span>
              </div>
            </div>
            <button className="btn btn-dark my-type-cta" onClick={() => navigate("/test/result")}>
              자세히 보기 <ArrowRight size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="my-type-card">
          <div className="my-type-card-main">
            <div className="my-type-card-title">유형 프로필</div>
            <p>유형 검사를 하면 맞춤 공고와 데이터 근거를 볼 수 있어요.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/test")}>
            검사 시작
          </button>
        </div>
      )}

      <div className="my-split">
        <div className="my-panel">
          <h2>
            북마크한 공고 <span className="my-panel-sub">(마감임박순)</span>
          </h2>
          <div className="my-list">
            {bookmarkedNotices.length > 0 ? (
              bookmarkedNotices.map((n) => (
                <div key={n.id} className="my-bookmark-row">
                  <span className={urgencyBadgeClass(n.urgency)}>{n.dday}</span>
                  <div className="my-bookmark-body">
                    <div className="my-bookmark-title">{n.title}</div>
                    <div className="my-bookmark-short">{deadlineFromDday(n.ddayNum)}</div>
                  </div>
                  <BookmarkButton id={n.id} />
                </div>
              ))
            ) : (
              <div className="my-empty">아직 북마크한 공고가 없어요</div>
            )}
          </div>
        </div>
        <div className="my-panel">
          <h2>최근 챗봇 대화</h2>
          <div className="my-list">
            {conversations.length > 0 ? (
              conversations.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  className="my-chat-item"
                  onClick={() => {
                    setActiveConversation(c.id);
                    navigate("/chat");
                  }}
                >
                  <div className="my-chat-title">{c.title}</div>
                  <div className="my-chat-sub">{c.sub}</div>
                </button>
              ))
            ) : (
              <div className="my-empty">아직 챗봇과 나눈 대화가 없어요</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
