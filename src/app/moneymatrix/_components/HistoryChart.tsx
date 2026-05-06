"use client";

import { GameRound } from "../_lib/types";

interface Props {
  history: GameRound[];
  target: number;
}

export default function HistoryChart({ history, target }: Props) {
  if (history.length === 0) return null;

  const points = [20, ...history.map((r) => r.endBalance)];
  const max = Math.max(target, ...points) * 1.05;
  const range = max;
  const width = 400;
  const height = 100;
  const pad = 8;

  const coords = points.map((val, i) => {
    const x = pad + (i / (points.length - 1 || 1)) * (width - pad * 2);
    const y = height - pad - (val / range) * (height - pad * 2);
    return [x, y];
  });

  const pathD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const targetY = height - pad - (target / range) * (height - pad * 2);

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--line-strong)" }} className="w-full rounded-2xl p-5">
      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-3)" }}>Portfolio History</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
        <line x1={pad} y1={targetY} x2={width - pad} y2={targetY} stroke="#eab308" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
        <path
          d={`${pathD} L${coords[coords.length - 1][0]},${height - pad} L${coords[0][0]},${height - pad} Z`}
          fill="rgba(61,204,145,0.1)"
        />
        <path d={pathD} fill="none" stroke="#3DCC91" strokeWidth="2.5" strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#3DCC91" />
        ))}
      </svg>
      <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-4)" }}>
        <span>Start</span>
        <span style={{ color: "rgba(234,179,8,0.6)" }}>— $1,000 target</span>
        <span>Now</span>
      </div>
    </div>
  );
}
