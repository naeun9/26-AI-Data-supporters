import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

const CHIP_GROUP_SIZE = 10;

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** 페이지 번호 칩을 10단위로 끊어서 보여주는 하단 페이지네이션. NoticesPage/EducationPage 공용. */
export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const groupStart = Math.floor((page - 1) / CHIP_GROUP_SIZE) * CHIP_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + CHIP_GROUP_SIZE - 1, totalPages);
  const chips = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);
  const showLastPage = groupEnd < totalPages;

  return (
    <nav className="pagination" aria-label="페이지 네비게이션">
      <button
        className="pagination-arrow"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeft size={16} />
      </button>
      {chips.map((p) => (
        <button
          key={p}
          className={`pagination-btn${p === page ? " active" : ""}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      {showLastPage && (
        <>
          <span className="pagination-ellipsis">…</span>
          <button
            className="pagination-btn"
            onClick={() => onChange(totalPages)}
            aria-label={`마지막 페이지 (${totalPages})`}
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        className="pagination-arrow"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
