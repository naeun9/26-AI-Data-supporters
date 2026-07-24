import { useEffect, useState } from "react";
import { shareToKakao } from "./kakao";
import { deadlineDate, formatDeadlineTime, parseDeadlineTime } from "./matching";
import type { AnnouncementDetail, MatchResult } from "./types";

/** 사이트 도메인 파비콘 (구글 파비콘 서비스) */
export function faviconUrl(u: string | null, size = 64): string | null {
  if (!u) return null;
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(u).hostname}&sz=${size}`;
  } catch {
    return null;
  }
}

/** 초 단위로 흘러가는 마감 카운트다운 */
function Countdown({ end }: { end: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = end.getTime() - now;
  if (diff <= 0) return <span className="countdown over">마감되었어요</span>;

  const days = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span className={`countdown${diff < 86_400_000 ? " urgent" : ""}`}>
      {days > 0 && <b>{days}일 </b>}
      <b>
        {pad(h)}:{pad(m)}:{pad(s)}
      </b>{" "}
      남음
    </span>
  );
}

/** thum.io 스크린샷 URL — App의 프리로드와 동일한 문자열이어야 브라우저 캐시가 맞는다 */
export function shotUrl(url: string): string {
  return `https://image.thum.io/get/width/900/${url}`;
}

/** 공고 사이트 첫 화면 미리보기 */
function SitePreview({ url }: { url: string }) {
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const shot = shotUrl(url);
  return (
    <div className="preview-wrap">
      <a href={url} target="_blank" rel="noreferrer" className="preview-link">
        {state !== "fail" ? (
          <>
            {state === "loading" && <div className="preview-skeleton">사이트 화면을 캡처하는 중…</div>}
            <img
              className="preview-shot"
              src={shot}
              alt="공고 사이트 미리보기"
              style={state === "loading" ? { display: "none" } : undefined}
              onLoad={() => setState("ok")}
              onError={() => setState("fail")}
            />
          </>
        ) : (
          <div className="preview-skeleton">미리보기를 불러오지 못했어요 — 클릭해서 사이트로 이동</div>
        )}
      </a>
      <div className="preview-note">
        공고 사이트 첫 화면 미리보기 · 클릭하면{" "}
        <a href={url} target="_blank" rel="noreferrer">
          새 탭에서 열려요 ↗
        </a>
      </div>
    </div>
  );
}

function fmtDate(yyyymmdd: string | null): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "-";
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

interface Props {
  sel: MatchResult;
  detail: AnnouncementDetail | null;
  focus: string | null;
  focusBusy: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}

export function DetailPanel({ sel, detail, focus, focusBusy, saved, onToggleSave, onClose }: Props) {
  const n = sel.notice;
  const time = parseDeadlineTime(detail?.pbanc_ctnt ?? null);
  const end = deadlineDate(n.pbanc_rcpt_end_dt, time);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const icon = faviconUrl(n.detl_pg_url);

  // 드로어 열려있는 동안 배경 스크롤 잠금 + ESC로 닫기
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleShare() {
    const msg = await shareToKakao({
      title: n.biz_pbanc_nm,
      description: [n.pbanc_ntrp_nm, n.supt_biz_clsfc, `마감 ${fmtDate(n.pbanc_rcpt_end_dt)}`]
        .filter(Boolean)
        .join(" · "),
      url: n.detl_pg_url ?? "https://changup-item-matcher.vercel.app",
    });
    setShareMsg(msg ?? "카카오톡 공유 창을 열었어요!");
  }

  const applyMethods = detail
    ? [
        ["온라인", detail.aply_mthd_onli_rcpt_istc],
        ["방문", detail.aply_mthd_vst_rcpt_istc],
        ["우편", detail.aply_mthd_pssr_rcpt_istc],
        ["이메일", detail.aply_mthd_eml_rcpt_istc],
        ["팩스", detail.aply_mthd_fax_rcpt_istc],
        ["기타", detail.aply_mthd_etc_istc],
      ].filter(([, v]) => v && String(v).trim())
    : [];

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="detail-panel" role="dialog" aria-modal="true">
        <div className="detail-head">
          {icon && <img className="detail-favicon" src={icon} alt="" />}
          <div className="detail-title">{n.biz_pbanc_nm}</div>
          <button
            className={`save-btn${saved ? " on" : ""}`}
            onClick={onToggleSave}
            title={saved ? "저장 해제" : "저장"}
          >
            {saved ? "★ 저장됨" : "☆ 저장"}
          </button>
          <button className="detail-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
      <div className="detail-meta">
        {[n.pbanc_ntrp_nm, n.supt_biz_clsfc, n.supt_regin].filter(Boolean).join(" · ")}
      </div>

      {/* 마감 카운트다운 */}
      <div className="detail-deadline">
        <span className="lbl-strong">마감</span>
        <span>
          {fmtDate(n.pbanc_rcpt_end_dt)}
          {time ? ` ${formatDeadlineTime(time)}` : " 자정 기준"}
        </span>
        {end && <Countdown end={end} />}
      </div>

      {/* 집중 포인트 (빨간 한 줄) */}
      <div className="focus-line">
        <span className="focus-badge">집중 포인트</span>
        {focusBusy ? (
          <span className="focus-wait">공고를 읽고 핵심을 뽑는 중…</span>
        ) : (
          <span className="focus-text">
            {focus ??
              `'${sel.matched.slice(0, 3).join("', '")}' 조건이 정확히 겹치는 공고 — 신청 자격 요건부터 확인하세요.`}
          </span>
        )}
      </div>

      {/* 공고 사이트 미리보기 — 서버사이드 스크린샷(thum.io)이라 iframe 차단 무관 */}
      {n.detl_pg_url && <SitePreview url={n.detl_pg_url} />}

      {/* 상세 정보 */}
      <div className="detail-rows">
        <div className="d-row">
          <span className="d-key">접수기간</span>
          <span>
            {fmtDate(n.pbanc_rcpt_bgng_dt)} ~ {fmtDate(n.pbanc_rcpt_end_dt)}
          </span>
        </div>
        {n.aply_trgt && (
          <div className="d-row">
            <span className="d-key">신청대상</span>
            <span>{n.aply_trgt}</span>
          </div>
        )}
        {n.biz_enyy && (
          <div className="d-row">
            <span className="d-key">창업업력</span>
            <span>{n.biz_enyy}</span>
          </div>
        )}
        {n.biz_trgt_age && (
          <div className="d-row">
            <span className="d-key">연령</span>
            <span>{n.biz_trgt_age}</span>
          </div>
        )}
        {applyMethods.length > 0 && (
          <div className="d-row">
            <span className="d-key">신청방법</span>
            <span>{applyMethods.map(([k, v]) => `${k}: ${v}`).join(" / ")}</span>
          </div>
        )}
        {detail?.aply_excl_trgt_ctnt && (
          <div className="d-row">
            <span className="d-key">제외대상</span>
            <span>{detail.aply_excl_trgt_ctnt}</span>
          </div>
        )}
        {detail?.biz_prch_dprt_nm && (
          <div className="d-row">
            <span className="d-key">담당</span>
            <span>
              {detail.biz_prch_dprt_nm}
              {detail.prch_cnpl_no ? ` (${detail.prch_cnpl_no})` : ""}
            </span>
          </div>
        )}
      </div>

      {/* 공고 본문 */}
      {detail?.pbanc_ctnt && <div className="detail-body">{detail.pbanc_ctnt}</div>}

      {/* 링크 버튼들 */}
      <div className="detail-links">
        {n.detl_pg_url && (
          <a className="btn primary" href={n.detl_pg_url} target="_blank" rel="noreferrer">
            공고 페이지 ↗
          </a>
        )}
        {detail?.biz_aply_url && (
          <a className="btn" href={detail.biz_aply_url} target="_blank" rel="noreferrer">
            바로 신청 ↗
          </a>
        )}
        {detail?.biz_gdnc_url && (
          <a className="btn" href={detail.biz_gdnc_url} target="_blank" rel="noreferrer">
            사업 안내 ↗
          </a>
        )}
        <button className="btn kakao-btn" onClick={handleShare}>
          카카오톡 공유
        </button>
      </div>
      {shareMsg && <div className="share-msg">{shareMsg}</div>}
      </div>
    </>
  );
}
