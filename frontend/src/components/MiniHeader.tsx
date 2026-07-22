import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import kisedLogo from "../assets/kised-logo.png";
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
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={kisedLogo} alt="창업진흥원" className="kised-logo" />
          <span className="brand-divider" aria-hidden="true" />
          <Link to="/" className="brand-link">
            <span className="brand-mark">K</span>
            <span className="brand-name" style={{ fontSize: title ? 17.5 : 18.5, fontWeight: title ? 700 : 800 }}>
              {title ?? "창업메이트"}
            </span>
          </Link>
        </span>
        {right}
      </div>
    </header>
  );
}
