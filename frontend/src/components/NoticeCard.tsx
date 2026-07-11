import { Link } from "react-router-dom";
import type { Notice } from "../types";
import { urgencyTextClass } from "./urgency";
import { BookmarkButton } from "./BookmarkButton";
import "./NoticeCard.css";

interface Props {
  notice: Notice;
  showBookmark?: boolean;
}

/** Vertical card used on Home / Result screens for recommended notices. */
export function NoticeCard({ notice, showBookmark = false }: Props) {
  return (
    <Link to={`/notices/${notice.id}`} className="notice-card card">
      <div className="notice-card-top">
        {notice.recommended ? (
          <span className="notice-card-badge">추천</span>
        ) : (
          <span />
        )}
        <div className="notice-card-top-right">
          <span className={urgencyTextClass(notice.urgency)}>{notice.dday}</span>
          {showBookmark && <BookmarkButton id={notice.id} />}
        </div>
      </div>
      <div className="notice-card-title">{notice.title}</div>
      <div className="notice-card-meta">{notice.meta}</div>
    </Link>
  );
}
