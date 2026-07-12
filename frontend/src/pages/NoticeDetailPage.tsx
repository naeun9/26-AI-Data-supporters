import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { getNoticeDetail } from "../api/client";
import { ALL_CAREER_PERIODS } from "../api/kised";
import type { AnnouncementDetail } from "../api/kised";
import { toAbsoluteHref } from "../utils/url";
import { BookmarkButton } from "../components/BookmarkButton";
import { urgencyBadgeClass } from "../components/urgency";
import { useAppState } from "../state/AppState";
import "./NoticeDetailPage.css";

type LoadState = "loading" | "ready" | "not-found" | "error";

/** "대학생,일반인,대학" 같은 콤마 나열을 칩으로 쪼개 렌더하기 위한 분리. */
function splitChips(value: string): string[] {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

/** KISED 데이터 전수 조사 기준 실제로 존재하는 신청대상/창업기간 값 전체 집합.
 * 한 공고가 이 전체를 다 포함하면 "제한 없음(전체)"이라는 뜻이라 칩을 다 나열할 필요가 없다. */
const ALL_APPLY_TARGETS = new Set(["청소년", "대학생", "일반인", "대학", "연구기관", "일반기업", "1인 창조기업"]);
const ALL_CAREER_PERIODS_SET = new Set<string>(ALL_CAREER_PERIODS);

function chipsOrAll(value: string, fullSet: Set<string>): string[] {
  const tokens = splitChips(value);
  const isAll = tokens.length === fullSet.size && tokens.every((t) => fullSet.has(t));
  return isAll ? ["전체"] : tokens;
}

/** 숫자만 남겨 02(서울)는 2-3-4 자리, 그 외 10~11자리는 3-3(4)-4 자리로 하이픈 삽입. */
function formatPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("02")) {
    if (digits.length === 9) return `02-${digits.slice(2, 5)}-${digits.slice(5)}`;
    if (digits.length === 10) return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return raw;
  }
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return raw;
}

/** KISED가 이메일을 그대로 안 주고 암호화된 토큰으로 내려줄 때가 있음(예: "zYsjhH/N...=") — @ 없으면 그 케이스. */
function isRealEmail(value: string): boolean {
  return value.includes("@");
}

export function NoticeDetailPage() {
  const { sn } = useParams<{ sn: string }>();
  const navigate = useNavigate();
  const { showToast, myStage } = useAppState();
  const [notice, setNotice] = useState<AnnouncementDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  function copyLink(value: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => showToast("링크를 복사했어요"))
      .catch(() => showToast("복사에 실패했어요"));
  }

  useEffect(() => {
    if (!sn) return;
    setState("loading");
    setNotice(null);
    getNoticeDetail(sn)
      .then((detail) => {
        setNotice(detail);
        setState("ready");
      })
      .catch((err) => {
        setState(err instanceof Error && err.message === "NOT_FOUND" ? "not-found" : "error");
      });
  }, [sn]);

  if (state === "loading") {
    return <main className="container detail-status">불러오는 중…</main>;
  }

  if (state === "not-found" || state === "error") {
    return (
      <main className="container detail-status">
        <div className="detail-notfound">
          <div className="detail-notfound-title">
            {state === "not-found" ? "찾을 수 없는 공고예요" : "공고를 불러오지 못했어요"}
          </div>
          <div className="detail-notfound-sub">
            {state === "not-found"
              ? "마감됐거나 잘못된 주소일 수 있어요."
              : "잠시 후 다시 시도해주세요."}
          </div>
          <Link to="/notices" className="btn btn-primary detail-notfound-cta">
            지원공고 목록으로
          </Link>
        </div>
      </main>
    );
  }

  if (!notice) return null;

  const applyHref = notice.applyUrl || notice.detailUrl;

  return (
    <main className="container detail-main">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> 목록으로
      </button>

      {/* 1. 헤더 */}
      <div className="detail-header">
        <div className="detail-header-top">
          <span className={`${urgencyBadgeClass(notice.urgency)} detail-dday-badge`}>{notice.dday}</span>
          <BookmarkButton id={notice.id} />
        </div>
        <h1 className="detail-title">{notice.title}</h1>
      </div>

      {/* 2. 메타 줄 */}
      <div className="detail-meta">
        <span>{notice.org}</span>
        <span className="detail-meta-dot">·</span>
        <span>{notice.region}</span>
        {(notice.bgngDateLabel || notice.endDateLabel) && (
          <>
            <span className="detail-meta-dot">·</span>
            <span>
              {notice.bgngDateLabel ?? "상시"} ~ {notice.endDateLabel ?? "상시"}
            </span>
          </>
        )}
      </div>

      {/* 3. 요약 카드 */}
      <div className="detail-summary card">
        <div className="detail-summary-item">
          <div className="detail-summary-label">신청대상</div>
          <div className="detail-chip-group">
            {chipsOrAll(notice.applyTargetFull, ALL_APPLY_TARGETS).map((v) => (
              <span key={v} className="chip">
                {v}
              </span>
            ))}
          </div>
        </div>
        <div className="detail-summary-item">
          <div className="detail-summary-label">창업기간</div>
          <div className="detail-chip-group">
            {chipsOrAll(notice.careerPeriod, ALL_CAREER_PERIODS_SET).map((v) => {
              const isMine =
                !!myStage && (v === "전체" ? splitChips(notice.careerPeriod).includes(myStage) : v === myStage);
              return (
                <span key={v} className={`chip${isMine ? " chip-mine" : ""}`}>
                  {v}
                </span>
              );
            })}
          </div>
        </div>
        <div className="detail-summary-item">
          <div className="detail-summary-label">지원분야</div>
          <div className="detail-chip-group">
            {splitChips(notice.field).map((v) => (
              <span key={v} className="chip">
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 공고 본문 */}
      {notice.content && (
        <section className="detail-section card">
          <h2>공고 내용</h2>
          <p className="detail-content">{notice.content}</p>
        </section>
      )}

      {/* 5. 신청방법 */}
      {(notice.applyMethods.length > 0 || notice.exclTarget) && (
        <section className="detail-section card">
          <h2>신청방법</h2>
          {notice.applyMethods.length > 0 && (
            <ul className="detail-apply-methods">
              {notice.applyMethods.map((m) => {
                const applyLinkHref = m.label === "온라인" ? toAbsoluteHref(m.value) : null;
                if (applyLinkHref) {
                  return (
                    <li key={m.label}>
                      <span className="detail-apply-method-label">{m.label}</span>
                      <span className="detail-apply-method-link-row">
                        <a
                          href={applyLinkHref}
                          target="_blank"
                          rel="noreferrer"
                          className="detail-apply-method-value detail-apply-method-link"
                        >
                          {m.value}
                        </a>
                        <button
                          type="button"
                          className="detail-copy-btn"
                          aria-label="신청 링크 복사"
                          onClick={() => copyLink(m.value)}
                        >
                          <Copy size={13} />
                        </button>
                      </span>
                    </li>
                  );
                }
                if (m.label === "이메일" && !isRealEmail(m.value)) {
                  return (
                    <li key={m.label}>
                      <span className="detail-apply-method-label">{m.label}</span>
                      <span className="detail-apply-method-value detail-apply-method-muted">
                        K-Startup 공고 페이지에서 이메일 주소를 확인할 수 있어요
                        {notice.detailUrl && (
                          <>
                            {" · "}
                            <a href={notice.detailUrl} target="_blank" rel="noreferrer" className="detail-apply-method-link">
                              바로가기
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={m.label}>
                    <span className="detail-apply-method-label">{m.label}</span>
                    <span className="detail-apply-method-value">{m.value}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {notice.exclTarget && (
            <div className="detail-excl">
              <div className="detail-excl-label">신청제외 대상</div>
              <p>{notice.exclTarget}</p>
            </div>
          )}
        </section>
      )}

      {/* 6. 하단 액션 */}
      <div className="detail-actions card">
        {applyHref && (
          <a href={applyHref} target="_blank" rel="noreferrer" className="btn btn-dark detail-apply-btn">
            K-Startup에서 신청하기 <ExternalLink size={15} />
          </a>
        )}
        {(notice.department || notice.contact) && (
          <div className="detail-contact">
            {notice.department && <span>{notice.department}</span>}
            {notice.contact && <span>전화번호 : {formatPhone(notice.contact)}</span>}
          </div>
        )}
      </div>
    </main>
  );
}
