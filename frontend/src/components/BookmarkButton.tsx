import { Bookmark } from "lucide-react";
import { useAppState } from "../state/AppState";
import "./BookmarkButton.css";

export function BookmarkButton({ id }: { id: string }) {
  const { loggedIn, isBookmarked, toggleBookmark, showToast } = useAppState();
  const active = isBookmarked(id);

  return (
    <button
      className={`bookmark-btn${active ? " active" : ""}`}
      aria-label={active ? "북마크 해제" : "북마크"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!loggedIn) {
          showToast("로그인 후 이용할 수 있어요");
          return;
        }
        toggleBookmark(id);
      }}
    >
      <Bookmark size={18} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
