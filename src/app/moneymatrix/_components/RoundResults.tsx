"use client";

import { GameRound } from "../_lib/types";

interface Props {
  round: GameRound;
  onContinue: () => void;
  isGameOver: boolean;
  isWinner: boolean;
}

export default function RoundResults({ round, onContinue, isGameOver, isWinner }: Props) {
  const totalProfit = round.results.reduce((s, r) => s + r.profit, 0);
  const profitPositive = totalProfit >= 0;

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--line-strong)" }} className="w-full rounded-2xl p-5 space-y-4">
      {round.marketEvent && (
        <div
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)" }}
          className="rounded-xl p-3 text-center"
        >
          <p style={{ color: "#eab308" }} className="font-bold text-lg">
            {round.marketEvent.emoji} {round.marketEvent.name}
          </p>
          <p style={{ color: "#fde68a" }} className="text-sm mt-0.5">{round.marketEvent.description}</p>
        </div>
      )}

      <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Round {round.round} Results</h2>

      <div className="space-y-2">
        {round.results.map((r, i) => (
          <div
            key={i}
            style={{ background: "var(--surface-2)" }}
            className="flex items-center justify-between rounded-xl px-4 py-3"
          >
            <div>
              <p className="font-medium" style={{ color: "var(--text)" }}>
                {r.emoji} {r.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                ${r.amountInvested.toFixed(2)} invested
                {r.event && <span style={{ color: "#eab308" }}> · {r.event}</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ color: r.profit >= 0 ? "#3DCC91" : "#ef4444" }}>
                {r.profit >= 0 ? "+" : ""}${r.profit.toFixed(2)}
              </p>
              <p className="text-xs" style={{ color: r.returnPct >= 0 ? "#3DCC91" : "#ef4444" }}>
                {r.returnPct >= 0 ? "+" : ""}{r.returnPct}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid var(--line)" }}>
        <div>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Round P&L</p>
          <p className="text-2xl font-bold" style={{ color: profitPositive ? "#3DCC91" : "#ef4444" }}>
            {profitPositive ? "+" : ""}${totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>New Balance</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            ${round.endBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {isWinner && (
        <div
          style={{ background: "rgba(61,204,145,0.08)", border: "1px solid rgba(61,204,145,0.4)" }}
          className="text-center py-4 rounded-xl"
        >
          <p className="text-4xl mb-2">🎉</p>
          <p style={{ color: "#3DCC91" }} className="text-2xl font-bold">You hit $1,000!</p>
          <p style={{ color: "#3DCC91" }} className="text-sm mt-1 opacity-70">You turned $20 into a money machine.</p>
        </div>
      )}

      {isGameOver && !isWinner && (
        <div
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}
          className="text-center py-4 rounded-xl"
        >
          <p className="text-4xl mb-2">💀</p>
          <p style={{ color: "#ef4444" }} className="text-2xl font-bold">Broke.</p>
          <p style={{ color: "#ef4444" }} className="text-sm mt-1 opacity-70">You lost everything. The market is merciless.</p>
        </div>
      )}

      <button
        onClick={onContinue}
        style={{ background: "#3DCC91", color: "#0C0D0F" }}
        className="w-full py-3 font-bold rounded-xl transition-opacity"
      >
        {isGameOver || isWinner ? "Play Again" : "Next Round →"}
      </button>
    </div>
  );
}
