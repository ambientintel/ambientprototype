"use client";

import { useState } from "react";
import { InvestmentType, Allocation } from "../_lib/types";
import { INVESTMENT_LIST } from "../_lib/investments";

interface Props {
  balance: number;
  onInvest: (allocations: Allocation[]) => void;
}

const RISK_COLOR: Record<string, string> = {
  low: "#3DCC91",
  medium: "#eab308",
  high: "#f97316",
  extreme: "#ef4444",
};

export default function AllocationPanel({ balance, onInvest }: Props) {
  const [amounts, setAmounts] = useState<Record<InvestmentType, string>>({
    savings: "",
    stocks: "",
    realestate: "",
    sidehustle: "",
    crypto: "",
  });

  const totalAllocated = Object.values(amounts).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const remaining = Math.round((balance - totalAllocated) * 100) / 100;

  function handleChange(type: InvestmentType, value: string) {
    setAmounts((prev) => ({ ...prev, [type]: value }));
  }

  function handleMax(type: InvestmentType) {
    const others = Object.entries(amounts)
      .filter(([k]) => k !== type)
      .reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0);
    const max = Math.max(0, Math.round((balance - others) * 100) / 100);
    setAmounts((prev) => ({ ...prev, [type]: String(max) }));
  }

  function handleSubmit() {
    const allocations: Allocation[] = Object.entries(amounts)
      .map(([type, val]) => ({ type: type as InvestmentType, amount: parseFloat(val) || 0 }))
      .filter((a) => a.amount > 0);
    if (allocations.length === 0 || totalAllocated > balance + 0.01) return;
    onInvest(allocations);
  }

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--line-strong)" }} className="w-full rounded-2xl p-5">
      <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Where does your money go?</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>
        Allocate your{" "}
        <span style={{ color: "#3DCC91" }} className="font-semibold">${balance.toFixed(2)}</span>{" "}
        across investments.
      </p>

      <div className="space-y-3">
        {INVESTMENT_LIST.map((inv) => {
          const disabled = balance < inv.minCapital;
          return (
            <div
              key={inv.type}
              style={{
                background: disabled ? "transparent" : "var(--surface-2)",
                border: `1px solid ${disabled ? "var(--line)" : "var(--line-strong)"}`,
                opacity: disabled ? 0.4 : 1,
              }}
              className="rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: "var(--text)" }}>
                    {inv.emoji} {inv.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{inv.description}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: RISK_COLOR[inv.risk] }}>
                    Risk: {inv.risk} · Returns: {inv.minReturn}% to +{inv.maxReturn}%
                  </p>
                </div>
                {!disabled ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-3)" }}>$</span>
                      <input
                        type="number"
                        min="0"
                        max={balance}
                        step="0.01"
                        placeholder="0.00"
                        value={amounts[inv.type]}
                        onChange={(e) => handleChange(inv.type, e.target.value)}
                        style={{
                          background: "var(--surface-3)",
                          color: "var(--text)",
                          border: "1px solid var(--line-strong)",
                        }}
                        className="w-24 rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleMax(inv.type)}
                      className="text-xs font-medium"
                      style={{ color: "#3DCC91" }}
                    >
                      MAX
                    </button>
                  </div>
                ) : (
                  <span className="text-xs shrink-0" style={{ color: "var(--text-4)" }}>
                    Min ${inv.minCapital}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Remaining:{" "}
            <span style={{ color: remaining < 0 ? "#ef4444" : "var(--text)" }}>
              ${remaining.toFixed(2)}
            </span>
          </p>
          {remaining < 0 && (
            <p className="text-xs" style={{ color: "#ef4444" }}>Over budget!</p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={totalAllocated <= 0 || remaining < -0.01}
          style={{ background: "#3DCC91", color: "#0C0D0F" }}
          className="px-6 py-2.5 font-bold rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Invest →
        </button>
      </div>
    </div>
  );
}
