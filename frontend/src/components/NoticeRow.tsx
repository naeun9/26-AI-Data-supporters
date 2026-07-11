import { Link } from "react-router-dom";
import type { Notice } from "../types";
import { urgencyBadgeClass } from "./urgency";
import { BookmarkButton } from "./BookmarkButton";
import "./NoticeRow.css";

interface Props {
  notice: Notice;
  showRecommended?: boolean;
  variant?: "list" | "soon";
}

export function NoticeRow({ notice, showRecommended = false, variant = "list" }: Props) {
  return (
    <Link to={`/notices/${notice.id}`} className={`notice-row card${variant === "soon" ? " soon" : ""}`}>
      <div className="notice-row-logo" style={{ background: notice.logoBg, color: notice.logoInk }}>
        {notice.logo}
      </div>
      <div className="notice-row-body">
        <div className={`notice-row-badges${showRecommended ? " with-tag" : ""}`}>
          <span className={urgencyBadgeClass(notice.urgency)}>{notice.dday}</span>
          {showRecommended && notice.recommended && <span className="notice-row-badge">추천</span>}
        </div>
        <div className="notice-row-title">{notice.title}</div>
        <div className="notice-row-meta">{notice.meta}</div>
      </div>
      <BookmarkButton id={notice.id} />
    </Link>
  );
}
