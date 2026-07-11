import type { TypeKey } from "../types";

interface Props {
  type: TypeKey;
  size?: number;
  className?: string;
}

const SOFT = "var(--soft-2)";
const INK = "var(--ink)";
const ACCENT = "var(--primary)";

function TechGlyph() {
  return (
    <>
      <rect x="18" y="18" width="28" height="28" rx="5" fill={SOFT} stroke={INK} strokeWidth="2.5" />
      <rect x="26" y="26" width="12" height="12" rx="2" fill={ACCENT} />
      <path
        d="M24 18v-7M32 18v-7M40 18v-7M24 46v7M32 46v7M40 46v7M18 24h-7M18 32h-7M18 40h-7M46 24h7M46 32h7M46 40h7"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M44 10l2.2 4.4L51 16l-4 3 1 5-4-2.6L40 24l1-5-4-3 4.8-1.6L44 10z" fill={ACCENT} />
    </>
  );
}

function IdeaGlyph() {
  return (
    <>
      <path
        d="M32 10c-9 0-15 6.5-15 14.5 0 5.5 3 9 6 12 1.7 1.7 2 3 2 5h14c0-2 .3-3.3 2-5 3-3 6-6.5 6-12C47 16.5 41 10 32 10z"
        fill={SOFT}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M26 51h12M27 56h10" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 24v8M32 32l-4 4M32 32l4 4" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20l3 1M52 20l-3 1M32 4v3" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
    </>
  );
}

function MainstreetGlyph() {
  return (
    <>
      <path d="M14 26l3-10h30l3 10" fill={SOFT} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="M14 26c0 3.3 2.7 6 6 6s6-2.7 6-6c0 3.3 2.7 6 6 6s6-2.7 6-6c0 3.3 2.7 6 6 6s6-2.7 6-6"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M17 32v18h30V32" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="28" y="38" width="8" height="12" fill={ACCENT} />
    </>
  );
}

function CareerGlyph() {
  return (
    <>
      <rect x="13" y="12" width="22" height="28" rx="3" fill={SOFT} stroke={INK} strokeWidth="2.5" />
      <path d="M19 20h10M19 26h10M19 32h6" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M28 50h11a7 7 0 007-7V31" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41 38l5-7 5 7" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function ComebackGlyph() {
  return (
    <>
      <circle cx="32" cy="32" r="18" fill={SOFT} />
      <path d="M47 22a18 18 0 10 4 13" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M48 13v10h-10" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 38l6-7 5 4 7-9" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M38 26h5v5" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

const GLYPHS: Record<TypeKey, () => React.ReactElement> = {
  tech: TechGlyph,
  idea: IdeaGlyph,
  mainstreet: MainstreetGlyph,
  career: CareerGlyph,
  comeback: ComebackGlyph,
};

export function TypeIcon({ type, size = 40, className }: Props) {
  const Glyph = GLYPHS[type];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <Glyph />
    </svg>
  );
}
