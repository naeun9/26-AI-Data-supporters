interface Props {
  label: string;
  a: number;
  b: number;
  labelA: string;
  labelB: string;
  /** employment-style bar: bigger/bolder primary segment, centered minority segment */
  emphasis?: boolean;
  revealed?: boolean;
}

function segText(label: string, value: number) {
  if (value >= 25) return `${label} ${value.toFixed(1)}%`;
  if (value >= 10) return `${value.toFixed(1)}%`;
  return "";
}

export function StackedBar({ label, a, b, labelA, labelB, emphasis = false, revealed = true }: Props) {
  return (
    <div className="stacked-bar">
      <div className="stacked-bar-label">{label}</div>
      <div
        className={`stacked-bar-track${emphasis ? " emphasis" : ""}`}
        style={{ transform: `scaleX(${revealed ? 1 : 0})` }}
      >
        <div className="stacked-bar-seg a" style={{ width: `${a}%` }}>
          {segText(labelA, a)}
        </div>
        <div className="stacked-bar-seg b" style={{ width: `${b}%` }}>
          {segText(labelB, b)}
        </div>
      </div>
    </div>
  );
}
