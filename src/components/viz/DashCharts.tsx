/**
 * Lightweight pure-SVG intelligence charts (no chart library).
 */
import React, { useMemo } from "react";

export function Sparkline({
  values,
  width = 120,
  height = 36,
  stroke = "var(--accent)",
  fill = "var(--accent-dim)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  const path = useMemo(() => {
    if (!values.length) return { line: "", area: "" };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return [x, y] as const;
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [values, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <path d={path.area} fill={fill} opacity={0.9} />
      <path d={path.line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

const SCORE_PALETTE = [
  "#3dffa8",
  "#4ecbff",
  "#a78bfa",
  "#ffc857",
  "#ff6b7a",
  "#34d399",
];

/** Score vector donut — same layout language as Edge taxonomy */
export function ScoreRadar({
  scores,
  size = 120,
}: {
  scores: { label: string; value: number }[];
  size?: number;
}) {
  const slices = scores.map((s, i) => ({
    label: s.label,
    value: Math.max(0.02, Math.min(1, s.value)),
    color: SCORE_PALETTE[i % SCORE_PALETTE.length],
    pct: Math.round(Math.max(0, Math.min(1, s.value)) * 100),
  }));
  const mean =
    scores.length > 0
      ? Math.round(
          (scores.reduce((a, s) => a + Math.max(0, Math.min(1, s.value)), 0) /
            scores.length) *
            100
        )
      : 0;
  const total = slices.reduce((a, b) => a + b.value, 0) || 1;
  const r = size * 0.32;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = size * 0.14;
  let acc = 0;
  const C = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <defs>
          <linearGradient id="scoreDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#scoreDonutGrad)"
          strokeWidth={stroke + 4}
          opacity={0.5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {slices.map((s) => {
          const len = (s.value / total) * C;
          const dash = `${len} ${C - len}`;
          const offset = -acc + C * 0.25;
          acc += len;
          return (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 5px ${s.color}77)` }}
            />
          );
        })}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="var(--text)"
          fontSize={16}
          fontFamily="var(--font-mono)"
          fontWeight={700}
        >
          {mean}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={9}
          fontFamily="var(--font-sans)"
          fontWeight={700}
          letterSpacing="0.08em"
        >
          μ SCORE
        </text>
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{
                background: `linear-gradient(135deg, ${s.color}, ${s.color}99)`,
                boxShadow: `0 0 6px ${s.color}66`,
              }}
            />
            <span
              className="truncate font-semibold tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.label}
            </span>
            <span
              className="font-mono ml-auto tabular-nums font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              {s.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBars({
  rows,
}: {
  rows: { label: string; value: number; sub?: string; color?: string }[];
}) {
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-[11px] mb-1">
            <span
              style={{ color: "var(--text-secondary)" }}
              className="truncate pr-2 font-semibold"
            >
              {row.label}
            </span>
            <span className="font-mono tabular-nums font-semibold" style={{ color: "var(--text-muted)" }}>
              {row.sub ?? `${Math.round(row.value * 100)}%`}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--surface-2)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(Math.max(0, Math.min(1, row.value)) * 100)}%`,
                background: row.color || "var(--grad-primary)",
                boxShadow: "0 0 14px var(--accent-glow)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PipelineFunnel({
  stages,
}: {
  stages: { label: string; value: number; tone?: "ok" | "warn" | "muted" }[];
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const w = 40 + (s.value / max) * 60;
        const color =
          s.tone === "warn"
            ? "var(--warning)"
            : s.tone === "muted"
              ? "var(--text-muted)"
              : "var(--accent)";
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span
              className="w-5 text-[10px] font-mono text-right"
              style={{ color: "var(--text-muted)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 flex justify-center">
              <div
                className="h-7 flex items-center justify-center text-[10px] font-mono tracking-wide rounded-sm"
                style={{
                  width: `${w}%`,
                  minWidth: 80,
                  background: `linear-gradient(90deg, ${color}22, ${color}44)`,
                  border: `1px solid ${color}55`,
                  color: "var(--text)",
                  clipPath: "polygon(4% 0, 100% 0, 96% 100%, 0 100%)",
                }}
              >
                {s.label}
              </div>
            </div>
            <span className="w-10 text-right text-[12px] font-mono tabular-nums font-semibold">
              {s.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function EdgeMixDonut({
  slices,
  size = 120,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((a, b) => a + b.value, 0) || 1;
  const r = size * 0.32;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = size * 0.14;
  let acc = 0;
  const C = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <defs>
          <linearGradient id="edgeDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="url(#edgeDonutGrad)"
          strokeWidth={stroke + 4}
          opacity={0.5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {slices.map((s) => {
          const len = (s.value / total) * C;
          const dash = `${len} ${C - len}`;
          const offset = -acc + C * 0.25;
          acc += len;
          return (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 5px ${s.color}77)` }}
            />
          );
        })}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="var(--text)"
          fontSize={16}
          fontFamily="var(--font-mono)"
          fontWeight={700}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize={9}
          fontFamily="var(--font-sans)"
          fontWeight={700}
          letterSpacing="0.08em"
        >
          EDGES
        </text>
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{
                background: `linear-gradient(135deg, ${s.color}, ${s.color}99)`,
                boxShadow: `0 0 6px ${s.color}66`,
              }}
            />
            <span
              className="truncate font-semibold tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.label}
            </span>
            <span
              className="font-mono ml-auto tabular-nums font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineHeat({
  items,
}: {
  items: { t: number; weight: number }[];
}) {
  if (!items.length) return null;
  const min = Math.min(...items.map((i) => i.t));
  const max = Math.max(...items.map((i) => i.t));
  const span = max - min || 1;
  const buckets = 24;
  const counts = new Array(buckets).fill(0);
  items.forEach((i) => {
    const idx = Math.min(buckets - 1, Math.floor(((i.t - min) / span) * buckets));
    counts[idx] += i.weight;
  });
  const peak = Math.max(...counts, 1);

  return (
    <div>
      <div className="flex items-end gap-0.5 h-12">
        {counts.map((c, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: `${Math.max(8, (c / peak) * 100)}%`,
              background: `linear-gradient(180deg, var(--accent), var(--accent-deep))`,
              opacity: 0.25 + (c / peak) * 0.75,
            }}
            title={`${c.toFixed(1)}`}
          />
        ))}
      </div>
      <div
        className="flex justify-between mt-1 text-[9px] font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        <span>t₀</span>
        <span>activity density</span>
        <span>now</span>
      </div>
    </div>
  );
}
