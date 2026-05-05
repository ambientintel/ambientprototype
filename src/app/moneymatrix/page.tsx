"use client";

import { useState } from "react";
import { GameState, Allocation, GameRound } from "./_lib/types";
import { simulateRound } from "./_lib/engine";
import BalanceBar from "./_components/BalanceBar";
import AllocationPanel from "./_components/AllocationPanel";
import RoundResults from "./_components/RoundResults";
import HistoryChart from "./_components/HistoryChart";

const STARTING_BALANCE = 20;
const TARGET_BALANCE = 1000;

function initialState(): GameState {
  return {
    phase: "intro",
    balance: STARTING_BALANCE,
    round: 1,
    history: [],
    startingBalance: STARTING_BALANCE,
    targetBalance: TARGET_BALANCE,
  };
}

export default function MoneyMatrixPage() {
  const [game, setGame] = useState<GameState>(initialState());
  const [lastRound, setLastRound] = useState<GameRound | null>(null);
  const [isWinner, setWinner] = useState(false);
  const [isBroke, setBroke] = useState(false);

  function startGame() {
    setGame({ ...initialState(), phase: "allocate" });
    setLastRound(null);
    setWinner(false);
    setBroke(false);
  }

  function handleInvest(allocations: Allocation[]) {
    const result = simulateRound(game.round, game.balance, allocations);
    const newBalance = result.endBalance;
    const won = newBalance >= TARGET_BALANCE;
    const broke = newBalance <= 0;

    setLastRound(result);
    setWinner(won);
    setBroke(broke);
    setGame((prev) => ({
      ...prev,
      phase: "results",
      balance: newBalance,
      history: [...prev.history, result],
    }));
  }

  function handleContinue() {
    if (isWinner || isBroke) {
      startGame();
      return;
    }
    setGame((prev) => ({
      ...prev,
      phase: "allocate",
      round: prev.round + 1,
    }));
  }

  if (game.phase === "intro") {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg)" }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div>
            <p className="text-6xl mb-4">💵</p>
            <h1 className="text-5xl font-black tracking-tight" style={{ color: "var(--text)" }}>
              Money<span style={{ color: "#3DCC91" }}>Matrix</span>
            </h1>
            <p className="mt-3 text-lg" style={{ color: "var(--text-2)" }}>
              Turn <span style={{ color: "#3DCC91" }} className="font-bold">$20</span> into{" "}
              <span style={{ color: "#eab308" }} className="font-bold">$1,000</span> through smart investing.
            </p>
          </div>

          <div
            style={{ background: "var(--surface-1)", border: "1px solid var(--line-strong)" }}
            className="rounded-2xl p-5 text-left space-y-3"
          >
            <h2 className="font-bold text-lg" style={{ color: "var(--text)" }}>How to play</h2>
            <ul className="text-sm space-y-2" style={{ color: "var(--text-2)" }}>
              <li>💼 Each round, allocate your money across investments</li>
              <li>📈 Markets move — gains and losses are realistic</li>
              <li>⚡ Random market events shake things up</li>
              <li>🎯 Grow your portfolio to $1,000 to win</li>
              <li>💀 Hit $0 and the game is over</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            style={{ background: "#3DCC91", color: "#0C0D0F" }}
            className="w-full py-4 font-black text-xl rounded-2xl transition-opacity"
          >
            Start with $20 →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-md mx-auto space-y-4 pb-8">
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>
            Money<span style={{ color: "#3DCC91" }}>Matrix</span>
          </h1>
          <button
            onClick={startGame}
            className="text-xs"
            style={{ color: "var(--text-4)" }}
          >
            Restart
          </button>
        </div>

        <BalanceBar balance={game.balance} target={TARGET_BALANCE} round={game.round} />

        {game.history.length > 1 && (
          <HistoryChart history={game.history} target={TARGET_BALANCE} />
        )}

        {game.phase === "allocate" && (
          <AllocationPanel balance={game.balance} onInvest={handleInvest} />
        )}

        {game.phase === "results" && lastRound && (
          <RoundResults
            round={lastRound}
            onContinue={handleContinue}
            isGameOver={isBroke}
            isWinner={isWinner}
          />
        )}
      </div>
    </main>
  );
}
