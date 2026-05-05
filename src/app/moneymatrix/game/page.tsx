"use client";
import { useState, useId, useEffect, useRef } from "react";
import Link from "next/link";
import { GameState, Allocation, GameRound, InvestmentType } from "../_lib/types";
import { simulateRound } from "../_lib/engine";
import { INVESTMENT_LIST } from "../_lib/investments";
import "../moneymatrix.css";

const START = 20;
const TARGET = 1000;
const sage = "#3DCC91";
const gold = "#eab308";
const red = "#ef4444";
const RISK_COLOR: Record<string, string> = { low: sage, medium: gold, high: "#f97316", extreme: red };

// ── Animated balance counter ──────────────────────────────────────────────────
function BalanceCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();
    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    }
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <span>
      ${display.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

// ── Portfolio sparkline ───────────────────────────────────────────────────────
function Sparkline({ history }: { history: GameRound[] }) {
  const id = useId();
  const gid = `sp-${id}`;
  if (history.length < 2) return null;
  const pts = [START, ...history.map(r => r.endBalance)];
  const max = Math.max(TARGET, ...pts) * 1.1;
  const w = 400; const h = 64; const p = 4;
  const coords = pts.map((v, i) => [p + (i / (pts.length - 1)) * (w - p * 2), h - p - (v / max) * (h - p * 2)]);
  const pathD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const tY = h - p - (TARGET / max) * (h - p * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sage} stopOpacity="0.3" />
          <stop offset="100%" stopColor={sage} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={p} y1={tY} x2={w - p} y2={tY} stroke={gold} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
      <path d={`${pathD} L${coords[coords.length-1][0]},${h-p} L${coords[0][0]},${h-p} Z`} fill={`url(#${gid})`} />
      <path d={pathD} fill="none" stroke={sage} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill={sage} />)}
    </svg>
  );
}

// ── Allocation cards ──────────────────────────────────────────────────────────
function AllocationPhase({ balance, round, onInvest }: { balance: number; round: number; onInvest: (a: Allocation[]) => void }) {
  const [amounts, setAmounts] = useState<Record<InvestmentType, string>>({
    savings: "", stocks: "", realestate: "", sidehustle: "", crypto: "",
  });
  const total = Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const remaining = Math.round((balance - total) * 100) / 100;
  const over = remaining < -0.01;

  function setMax(type: InvestmentType) {
    const others = Object.entries(amounts).filter(([k]) => k !== type).reduce((s, [, v]) => s + (parseFloat(v) || 0), 0);
    setAmounts(p => ({ ...p, [type]: String(Math.max(0, Math.round((balance - others) * 100) / 100)) }));
  }
  function submit() {
    const allocs: Allocation[] = Object.entries(amounts)
      .map(([type, val]) => ({ type: type as InvestmentType, amount: parseFloat(val) || 0 }))
      .filter(a => a.amount > 0);
    if (!allocs.length || over) return;
    onInvest(allocs);
    setAmounts({ savings: "", stocks: "", realestate: "", sidehustle: "", crypto: "" });
  }

  return (
    <div>
      {/* Section label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-4)", margin: "0 0 4px" }}>Round {round}</p>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.02em", margin: 0 }}>
            Where does your money go?
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", margin: "0 0 3px" }}>Unallocated</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, margin: 0, color: over ? red : remaining > 0 ? "var(--text)" : sage, transition: "color 0.2s" }}>
            ${remaining.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Asset cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        {INVESTMENT_LIST.map(inv => {
          const disabled = balance < inv.minCapital;
          const val = amounts[inv.type];
          const amt = parseFloat(val) || 0;
          const active = amt > 0;
          return (
            <div key={inv.type} style={{
              background: active ? "var(--surface-2)" : "var(--surface-1)",
              border: `1px solid ${active ? "rgba(61,204,145,0.45)" : "var(--line)"}`,
              borderRadius: 14,
              padding: "20px 16px",
              opacity: disabled ? 0.35 : 1,
              display: "flex", flexDirection: "column", gap: 10,
              transition: "background 0.2s, border-color 0.2s",
              boxShadow: active ? "0 0 20px rgba(61,204,145,0.08)" : "none",
            }}>
              <div>
                <div style={{ fontSize: 32, marginBottom: 10, lineHeight: 1 }}>{inv.emoji}</div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.14em", color: RISK_COLOR[inv.risk], margin: "0 0 4px" }}>
                  {inv.risk} risk
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.3 }}>{inv.label}</p>
                <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.5, margin: "0 0 10px" }}>{inv.description}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "var(--surface-3)", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 10 }}>
                  <span style={{ color: inv.minReturn < 0 ? red : sage }}>{inv.minReturn > 0 ? "+" : ""}{inv.minReturn}%</span>
                  <span style={{ color: "var(--text-4)" }}>–</span>
                  <span style={{ color: sage }}>+{inv.maxReturn}%</span>
                </div>
              </div>
              {!disabled ? (
                <div style={{ marginTop: "auto" }}>
                  <div style={{ position: "relative", marginBottom: 6 }}>
                    <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-4)", pointerEvents: "none" }}>$</span>
                    <input
                      type="number" min="0" max={balance} step="0.01" placeholder="0"
                      value={val}
                      onChange={e => setAmounts(p => ({ ...p, [inv.type]: e.target.value }))}
                      style={{
                        width: "100%", background: "var(--surface-3)", color: "var(--text)",
                        border: `1px solid ${active ? "rgba(61,204,145,0.4)" : "var(--line-strong)"}`,
                        borderRadius: 8, padding: "7px 8px 7px 22px",
                        fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box",
                        boxShadow: active ? "0 0 0 2px rgba(61,204,145,0.12)" : "none",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                    />
                  </div>
                  <button onClick={() => setMax(inv.type)} style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: active ? sage : "var(--text-4)", background: "none", border: "none", cursor: "pointer", padding: 0, textTransform: "uppercase", letterSpacing: "0.12em", transition: "color 0.15s" }}>
                    Max →
                  </button>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, marginTop: "auto" }}>
                  Min ${inv.minCapital}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { label: "Allocated", val: `$${total.toFixed(2)}`, color: total > 0 ? "var(--text)" : "var(--text-4)" },
            { label: "Available", val: `$${balance.toFixed(2)}`, color: sage },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>{m.label}</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, margin: 0, color: m.color }}>{m.val}</p>
            </div>
          ))}
        </div>
        {over && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: red, margin: 0 }}>Over budget by ${(-remaining).toFixed(2)}</p>}
        <button
          onClick={submit}
          disabled={total <= 0 || over}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 28px", borderRadius: 999, border: "none", cursor: total <= 0 || over ? "not-allowed" : "pointer",
            background: total <= 0 || over ? "var(--surface-3)" : sage,
            color: total <= 0 || over ? "var(--text-4)" : "#0C0D0F",
            fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
            transition: "all 0.15s",
          }}
        >
          Invest →
        </button>
      </div>
    </div>
  );
}

// ── Results phase ─────────────────────────────────────────────────────────────
function ResultsPhase({ round, onContinue, isWinner, isBroke }: { round: GameRound; onContinue: () => void; isWinner: boolean; isBroke: boolean }) {
  const totalProfit = round.results.reduce((s, r) => s + r.profit, 0);
  const pos = totalProfit >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Market event */}
      {round.marketEvent && (
        <div style={{
          display: "flex", alignItems: "center", gap: 20, padding: "20px 24px",
          background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.22)", borderRadius: 14,
        }}>
          <span style={{ fontSize: 40, flexShrink: 0, filter: "drop-shadow(0 0 12px rgba(234,179,8,0.6))" }}>{round.marketEvent.emoji}</span>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: gold, margin: "0 0 3px" }}>Market Event · Round {round.round}</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{round.marketEvent.name}</p>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>{round.marketEvent.description}</p>
          </div>
        </div>
      )}

      {/* Win / broke state */}
      {isWinner && (
        <div style={{ padding: "32px 24px", background: "rgba(61,204,145,0.06)", border: "1px solid rgba(61,204,145,0.3)", borderRadius: 14, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12, filter: "drop-shadow(0 0 16px rgba(61,204,145,0.5))" }}>🎉</div>
          <p className="mm-shimmer-text" style={{ fontSize: "clamp(36px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.03em", display: "block", marginBottom: 8 }}>You hit $1,000!</p>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 24px" }}>You turned $20 into a money machine. The market bowed.</p>
          <button onClick={onContinue} style={{ padding: "12px 32px", borderRadius: 999, border: "none", background: sage, color: "#0C0D0F", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>Play Again →</button>
        </div>
      )}
      {isBroke && !isWinner && (
        <div style={{ padding: "32px 24px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>💀</div>
          <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 40, letterSpacing: "-0.02em", color: red, margin: "0 0 8px" }}>Broke.</p>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 24px" }}>The market is merciless. Diversify next time.</p>
          <button onClick={onContinue} style={{ padding: "12px 32px", borderRadius: 999, border: "none", background: red, color: "#fff", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>Try Again →</button>
        </div>
      )}

      {/* Results table */}
      {!isWinner && !isBroke && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 4px" }}>Round {round.round}</p>
              <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 26, letterSpacing: "-0.02em", margin: 0 }}>Position <em>Breakdown</em></h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)", margin: "0 0 2px" }}>Round P&L</p>
              <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 32, letterSpacing: "-0.03em", margin: 0, lineHeight: 1, color: pos ? sage : red }}>
                {pos ? "+" : ""}${totalProfit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Results cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 100px 120px", gap: 12, padding: "8px 16px", fontFamily: "var(--mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)" }}>
              <span>Position</span><span style={{ textAlign: "right" }}>Invested</span><span style={{ textAlign: "right" }}>Return</span><span style={{ textAlign: "right" }}>P&L</span><span style={{ textAlign: "right" }}>Event</span>
            </div>
            {round.results.map((r, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 100px 90px 100px 120px", gap: 12,
                padding: "14px 16px", borderRadius: 10, alignItems: "center",
                background: r.profit >= 0 ? "rgba(61,204,145,0.04)" : "rgba(239,68,68,0.04)",
                border: `1px solid ${r.profit >= 0 ? "rgba(61,204,145,0.12)" : "rgba(239,68,68,0.12)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{r.emoji}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{r.label}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{r.type}</p>
                  </div>
                </div>
                <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, margin: 0, color: "var(--text-3)" }}>${r.amountInvested.toFixed(2)}</p>
                <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, margin: 0, color: r.returnPct >= 0 ? sage : red }}>{r.returnPct >= 0 ? "+" : ""}{r.returnPct}%</p>
                <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, margin: 0, color: r.profit >= 0 ? sage : red }}>{r.profit >= 0 ? "+" : ""}${r.profit.toFixed(2)}</p>
                <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 10, color: r.event ? gold : "var(--text-4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.event ?? "—"}</p>
              </div>
            ))}
          </div>

          {/* Continue bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>New Balance</p>
              <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 26, letterSpacing: "-0.02em", margin: 0 }}>${round.endBalance.toFixed(2)}</p>
            </div>
            <button onClick={onContinue} style={{ padding: "11px 28px", borderRadius: 999, border: "none", background: sage, color: "#0C0D0F", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
              Round {round.round + 1} →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Game state ────────────────────────────────────────────────────────────────
function initGame(): GameState {
  return { phase: "allocate", balance: START, round: 1, history: [], startingBalance: START, targetBalance: TARGET };
}

// ── Main game page ────────────────────────────────────────────────────────────
export default function GamePage() {
  const [game, setGame] = useState<GameState>(initGame());
  const [lastRound, setLastRound] = useState<GameRound | null>(null);
  const [isWinner, setWinner] = useState(false);
  const [isBroke, setBroke] = useState(false);

  function reset() {
    setGame(initGame()); setLastRound(null); setWinner(false); setBroke(false);
  }
  function handleInvest(allocs: Allocation[]) {
    const result = simulateRound(game.round, game.balance, allocs);
    const won = result.endBalance >= TARGET;
    const broke = result.endBalance <= 0;
    setLastRound(result); setWinner(won); setBroke(broke);
    setGame(prev => ({ ...prev, phase: "results", balance: result.endBalance, history: [...prev.history, result] }));
  }
  function handleContinue() {
    if (isWinner || isBroke) { reset(); return; }
    setGame(prev => ({ ...prev, phase: "allocate", round: prev.round + 1 }));
    setLastRound(null);
  }

  const pct = Math.min((game.balance / TARGET) * 100, 100);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Sticky HUD ─────────────────────────────────────────────────────── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(28,33,39,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "12px 0 10px" }}>

            {/* Logo */}
            <Link href="/moneymatrix" style={{ textDecoration: "none", marginRight: "auto" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--text)" }}>
                Money<em className="mm-shimmer-em">Matrix</em>
              </span>
            </Link>

            {/* Round */}
            <div style={{ textAlign: "center", padding: "0 28px", borderRight: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>Round</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>{game.round}</p>
            </div>

            {/* Balance */}
            <div style={{ textAlign: "center", padding: "0 28px", borderRight: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>Portfolio</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, margin: 0, color: sage }}>
                <BalanceCounter value={game.balance} />
              </p>
            </div>

            {/* Progress */}
            <div style={{ textAlign: "center", padding: "0 28px", borderRight: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>Goal</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, margin: 0, color: gold }}>{pct.toFixed(1)}%</p>
            </div>

            {/* Reset */}
            <div style={{ paddingLeft: 20 }}>
              <button onClick={reset} style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)", background: "none", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}>
                Reset
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: "var(--surface-3)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${sage}, ${gold})`, transition: "width 0.7s ease" }} />
          </div>
        </div>
      </header>

      {/* ── Main game area ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ maxWidth: 960, width: "100%", margin: "0 auto", padding: "36px 32px 80px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Sparkline card — shows after round 2 */}
          {game.history.length >= 2 && (
            <div style={{ padding: "18px 24px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", margin: 0 }}>Portfolio History</p>
                <div style={{ display: "flex", gap: 14, fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 2, background: sage, borderRadius: 2, display: "inline-block" }} /> Value</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 1, background: gold, borderRadius: 2, display: "inline-block", opacity: 0.5 }} /> $1K goal</span>
                </div>
              </div>
              <div style={{ height: 64 }}><Sparkline history={game.history} /></div>
            </div>
          )}

          {/* Game content */}
          {game.phase === "allocate" && (
            <AllocationPhase balance={game.balance} round={game.round} onInvest={handleInvest} />
          )}
          {game.phase === "results" && lastRound && (
            <ResultsPhase round={lastRound} onContinue={handleContinue} isWinner={isWinner} isBroke={isBroke} />
          )}
        </div>
      </div>
    </div>
  );
}
