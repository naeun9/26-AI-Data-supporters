import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./MiniHeader.css";

interface Props {
  title?: string;
  right?: ReactNode;
  maxWidth?: number;
  sticky?: boolean;
  blurred?: boolean;
}

export function MiniHeader({ title, right, maxWidth = 1120, sticky = false, blurred = false }: Props) {
  const padding = maxWidth >= 1120 ? 32 : 24;
  return (
    <header className={`mini-header${sticky ? " sticky" : ""}${blurred ? " blurred" : ""}`}>
      <div className="mini-header-inner" style={{ maxWidth, padding: `0 ${padding}px` }}>
        <Link to="/" className="brand-link">
          <span className="brand-mark">K</span>
          <span className="brand-name" style={{ fontSize: title ? 15 : 16, fontWeight: title ? 700 : 800 }}>
            {title ?? "창업메이트"}
          </span>
        </Link>
        {right}
      </div>
    </header>
  );
}
