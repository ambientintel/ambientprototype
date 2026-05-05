"use client";

interface Props {
  balance: number;
  target: number;
  round: number;
}

export default function BalanceBar({ balance, target, round }: Props) {
  const pct = Math.min((balance / target) * 100, 100);

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--line-strong)" }} className="w-full rounded-2xl p-5">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p style={{ color: "var(--text-3)" }} className="text-sm">Portfolio Value</p>
          <p style={{ color: "#3DCC91" }} className="text-3xl font-bold">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: "var(--text-3)" }} className="text-sm">Target</p>
          <p style={{ color: "#eab308" }} className="text-xl font-semibold">${target.toLocaleString()}</p>
        </div>
      </div>
      <div style={{ background: "var(--surface-3)" }} className="w-full rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3DCC91, #eab308)" }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs" style={{ color: "var(--text-4)" }}>
        <span>$20</span>
        <span style={{ color: "#3DCC91" }} className="font-medium">{pct.toFixed(1)}% to goal</span>
        <span>$1,000</span>
      </div>
      <p className="text-xs mt-2 text-right" style={{ color: "var(--text-4)" }}>Round {round}</p>
    </div>
  );
}
