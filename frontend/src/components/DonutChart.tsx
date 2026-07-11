interface Props {
  a: number;
  b: number;
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
  size?: number;
  revealed?: boolean;
}

export function DonutChart({
  a,
  b,
  labelA,
  labelB,
  colorA = "#3b6fe0",
  colorB = "#eef0f3",
  size = 168,
  revealed = true,
}: Props) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const aLen = (a / (a + b)) * c;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke={colorB} strokeWidth="20" />
        <circle
          className="donut-arc"
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={colorA}
          strokeWidth="20"
          strokeDasharray={`${aLen} ${c - aLen}`}
          strokeDashoffset={revealed ? 0 : aLen}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" fontSize="23" fontWeight="800" fill="var(--ink)">
          {a.toFixed(1)}%
        </text>
        <text x="70" y="87" textAnchor="middle" fontSize="12" fill="var(--sub)">
          {labelA}
        </text>
      </svg>
      <div className="donut-legend">
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: colorA }} /> <span>{labelA}</span>{" "}
          <b>{a.toFixed(1)}%</b>
        </div>
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: "#dfe2e7" }} /> <span>{labelB}</span>{" "}
          <b>{b.toFixed(1)}%</b>
        </div>
      </div>
    </div>
  );
}
