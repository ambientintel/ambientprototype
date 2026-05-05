"use client";
import { useState, useId, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  GameState, StrategyCard as StrategyCardType, Allocation, RoundResult, PositionResult,
} from "./_types";
import {
  nextRegime, randomStartRegime, generateCards, simulateRound,
  REGIME_LABEL, REGIME_COLOR, REGIME_DESCRIPTION,
  CATEGORY_LABEL, RISK_COLOR, RISK_LABEL,
  STARTING_BALANCE, TARGET_BALANCE,
} from "./_engine";
import "../moneymatrix.css";

const sage = "#3DCC91";
const red  = "#FF5A5A";
const gold = "#FFB347";
const bot  = "#C77DFF"; // bot purple

// ── Animated balance counter ──────────────────────────────────────────────────
function BalanceCounter({ value, color }: { value: number; color?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const t0 = performance.now();
    const dur = 700;
    function tick(now: number) {
      const t = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (start + (value - start) * ease - start) * 1 + start);
      if (t < 1) requestAnimationFrame(tick);
      else { setDisplay(value); prev.current = value; }
    }
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <span style={color ? { color } : undefined}>
      ${display.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

// ── Portfolio sparkline ───────────────────────────────────────────────────────
function Sparkline({ history }: { history: RoundResult[] }) {
  const uid = useId();
  const pid = `sp-${uid}`;
  const bid = `sb-${uid}`;
  if (history.length < 2) return null;
  const pts    = [STARTING_BALANCE, ...history.map(r => r.endBalance)];
  const botPts = [STARTING_BALANCE, ...history.map(r => r.botEndBalance)];
  const cap = Math.max(TARGET_BALANCE, ...pts, ...botPts) * 1.1;
  const W = 400; const H = 60; const P = 4;
  const toCoords = (vals: number[]) => vals.map((v, i) => [
    P + (i / (vals.length - 1)) * (W - P * 2),
    H - P - (v / cap) * (H - P * 2),
  ]);
  const path = (coords: number[][], close = false) => {
    const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    if (!close) return d;
    const [lx, ly] = coords[coords.length - 1];
    const [fx] = coords[0];
    return `${d} L${lx.toFixed(1)},${(H - P).toFixed(1)} L${fx.toFixed(1)},${(H - P).toFixed(1)} Z`;
  };
  const pCoords = toCoords(pts);
  const bCoords = toCoords(botPts);
  const tY = H - P - (TARGET_BALANCE / cap) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={pid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sage} stopOpacity="0.22" />
          <stop offset="100%" stopColor={sage} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={bid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bot} stopOpacity="0.14" />
          <stop offset="100%" stopColor={bot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={P} y1={tY} x2={W - P} y2={tY} stroke={gold} strokeWidth="1" strokeDasharray="3,3" opacity="0.35" />
      <path d={path(bCoords, true)} fill={`url(#${bid})`} />
      <path d={path(bCoords)} fill="none" stroke={bot} strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      <path d={path(pCoords, true)} fill={`url(#${pid})`} />
      <path d={path(pCoords)} fill="none" stroke={sage} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pCoords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={sage} />)}
    </svg>
  );
}

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? sage : pct >= 60 ? "#7FFFB8" : pct >= 45 ? gold : "#FF9B9B";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "var(--surface-3)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: pct >= 75 ? `0 0 8px ${color}60` : "none",
        }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ── Kelly sizing bar ──────────────────────────────────────────────────────────
// Shows: player input vs Kelly optimal on a single track.
function KellySizingBar({ kellyAmt, playerAmt }: { kellyAmt: number; playerAmt: number }) {
  if (kellyAmt <= 0) return null;
  const ratio = playerAmt / kellyAmt;
  const clampedRatio = Math.min(ratio, 2);
  // bar width: Kelly = 50% of bar, 2x Kelly = 100%
  const playerWidth = Math.min((clampedRatio / 2) * 100, 100);
  const kellyPos = 50; // Kelly marker always at 50% of the bar
  const isAtKelly  = ratio >= 0.85 && ratio <= 1.15;
  const isOver     = ratio > 1.15;
  const fillColor  = isAtKelly ? sage : isOver ? red : gold;

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ position: "relative", height: 4, background: "var(--surface-3)", borderRadius: 99, overflow: "visible" }}>
        {/* Player fill */}
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${playerWidth}%`, background: fillColor,
          borderRadius: 99, transition: "width 0.2s, background 0.2s",
          opacity: playerAmt > 0 ? 1 : 0,
        }} />
        {/* Kelly marker */}
        <div style={{
          position: "absolute", left: `${kellyPos}%`, top: "50%",
          transform: "translate(-50%, -50%)",
          width: 2, height: 10, background: sage, borderRadius: 1,
          boxShadow: `0 0 4px ${sage}`,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Under
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: sage, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          ↑ Kelly
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Over-sized
        </span>
      </div>
    </div>
  );
}

// ── Return range display ──────────────────────────────────────────────────────
function ReturnRange({ min, max, isBinary, payoutMultiplier }: {
  min?: number; max?: number; isBinary?: boolean; payoutMultiplier?: number;
}) {
  if (isBinary) {
    const win = Math.round(((payoutMultiplier ?? 1.9) - 1) * 100);
    return (
      <div style={{ display: "flex", gap: 8, fontFamily: "var(--mono)", fontSize: 10 }}>
        <span style={{ padding: "2px 7px", background: "rgba(255,90,90,0.12)", borderRadius: 4, color: red }}>Loss: −100%</span>
        <span style={{ padding: "2px 7px", background: "rgba(61,204,145,0.12)", borderRadius: 4, color: sage }}>Win: +{win}%</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 6, fontFamily: "var(--mono)", fontSize: 10, alignItems: "center" }}>
      <span style={{ color: (min ?? 0) < 0 ? red : sage }}>{(min ?? 0) > 0 ? "+" : ""}{min ?? 0}%</span>
      <span style={{ flex: 1, height: 2, background: "linear-gradient(90deg, rgba(255,90,90,0.5), rgba(61,204,145,0.5))", borderRadius: 99, display: "block" }} />
      <span style={{ color: sage }}>+{max ?? 0}%</span>
    </div>
  );
}

// ── Strategy card ─────────────────────────────────────────────────────────────
function StrategyCard({
  card, amount, balance, onAmount, onKelly, onMax,
}: {
  card: StrategyCardType;
  amount: string;
  balance: number;
  onAmount: (v: string) => void;
  onKelly: () => void;
  onMax: () => void;
}) {
  const amt = parseFloat(amount) || 0;
  const active = amt > 0;
  const disabled = balance < card.minCapital;
  const kellyAmt = card.kellyFraction * balance;
  const riskColor = RISK_COLOR[card.riskTier] ?? gold;
  const hasKelly = card.kellyFraction > 0.01;

  return (
    <div style={{
      background: active ? "var(--surface-2)" : "var(--surface-1)",
      border: `1px solid ${card.isRecommended ? "rgba(61,204,145,0.55)" : active ? "rgba(61,204,145,0.25)" : "var(--line)"}`,
      borderRadius: 16, padding: "18px 18px 16px",
      display: "flex", flexDirection: "column", gap: 11,
      opacity: disabled ? 0.4 : 1,
      transition: "background 0.2s, border-color 0.2s",
      boxShadow: card.isRecommended ? "0 0 28px rgba(61,204,145,0.14), 0 0 0 1px rgba(61,204,145,0.2)" : active ? "0 0 18px rgba(61,204,145,0.06)" : "none",
      position: "relative",
    }}>
      {card.isRecommended && (
        <div style={{
          position: "absolute", top: -1, right: 14,
          background: sage, color: "#0C0D0F",
          fontFamily: "var(--mono)", fontSize: 8.5, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.12em",
          padding: "3px 9px", borderRadius: "0 0 7px 7px",
        }}>★ AI Pick</div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--text-4)", padding: "2px 7px", background: "var(--surface-3)", borderRadius: 4 }}>
          {CATEGORY_LABEL[card.category]}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.1em", color: riskColor }}>
          {RISK_LABEL[card.riskTier]}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{card.emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{card.name}</span>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)" }}>AI Confidence</span>
        </div>
        <ConfidenceBar pct={card.confidence} />
      </div>

      <p style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.55, margin: 0, flex: 1 }}>
        "{card.thesis}"
      </p>

      <ReturnRange min={card.minReturn} max={card.maxReturn} isBinary={card.isBinary} payoutMultiplier={card.payoutMultiplier} />

      {/* Kelly optimal */}
      {!disabled && hasKelly && (
        <div style={{
          padding: "8px 10px", background: "rgba(61,204,145,0.06)",
          border: "1px solid rgba(61,204,145,0.18)", borderRadius: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.12em", color: sage }}>
              Kelly Optimal
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: sage }}>
              ${kellyAmt.toFixed(2)} <span style={{ fontWeight: 400, color: "var(--text-4)", fontSize: 9 }}>({(card.kellyFraction * 100).toFixed(1)}%)</span>
            </span>
          </div>
          {amt > 0 && <KellySizingBar kellyAmt={kellyAmt} playerAmt={amt} />}
        </div>
      )}
      {!disabled && !hasKelly && (
        <div style={{ padding: "6px 10px", background: "rgba(255,90,90,0.06)", border: "1px solid rgba(255,90,90,0.15)", borderRadius: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: red, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            No Edge · Kelly = $0
          </span>
        </div>
      )}

      {/* Allocation input */}
      {!disabled ? (
        <div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-4)", pointerEvents: "none" }}>$</span>
              <input
                type="number" min="0" step="0.01" placeholder="0"
                value={amount}
                onChange={e => onAmount(e.target.value)}
                style={{
                  width: "100%", background: "var(--surface-3)", color: "var(--text)",
                  border: `1px solid ${active ? "rgba(61,204,145,0.4)" : "var(--line-strong)"}`,
                  borderRadius: 8, padding: "7px 8px 7px 22px",
                  fontFamily: "var(--mono)", fontSize: 12, outline: "none", boxSizing: "border-box",
                  boxShadow: active ? "0 0 0 2px rgba(61,204,145,0.12)" : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
              />
            </div>
            {hasKelly && (
              <button onClick={onKelly} style={{
                fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em",
                color: sage, background: "rgba(61,204,145,0.1)", border: "1px solid rgba(61,204,145,0.3)",
                borderRadius: 6, padding: "6px 8px", cursor: "pointer", whiteSpace: "nowrap",
              }}>Kelly</button>
            )}
            <button onClick={onMax} style={{
              fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--text-4)", background: "none", border: "none", cursor: "pointer", padding: "0 2px", whiteSpace: "nowrap",
            }}>Max</button>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
          Min ${card.minCapital}
        </p>
      )}
    </div>
  );
}

// ── Allocation phase ──────────────────────────────────────────────────────────
function AllocationPhase({ game, onSimulate }: { game: GameState; onSimulate: (allocs: Allocation[]) => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const total = Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const remaining = Math.round((game.balance - total) * 100) / 100;
  const over = remaining < -0.01;
  const regimeColor = REGIME_COLOR[game.regime];

  function setAmount(id: string, val: string) {
    setAmounts(p => ({ ...p, [id]: val }));
  }
  function handleMaxFor(id: string) {
    const others = Object.entries(amounts).filter(([k]) => k !== id).reduce((s, [, v]) => s + (parseFloat(v) || 0), 0);
    setAmounts(p => ({ ...p, [id]: String(Math.max(0, Math.round((game.balance - others) * 100) / 100)) }));
  }
  function handleKellyFor(id: string, fraction: number) {
    const kellyAmt = Math.min(game.balance, Math.round(fraction * game.balance * 100) / 100);
    setAmounts(p => ({ ...p, [id]: String(kellyAmt) }));
  }
  function submit() {
    const allocs = game.cards
      .map(c => ({ strategyId: c.id, amount: parseFloat(amounts[c.id] ?? "") || 0 }))
      .filter(a => a.amount > 0);
    if (!allocs.length || over) return;
    onSimulate(allocs);
    setAmounts({});
  }

  // Kelly total for footer guidance
  const kellyTotal = game.cards.reduce((s, c) => s + Math.min(c.kellyFraction, 1) * game.balance, 0);
  const kellyNorm = kellyTotal > game.balance ? game.balance : kellyTotal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Regime banner */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 22px", background: `${regimeColor}0D`, border: `1px solid ${regimeColor}30`, borderRadius: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: regimeColor, marginTop: 6, boxShadow: `0 0 8px ${regimeColor}`, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: regimeColor }}>Market Regime</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: regimeColor }}>{REGIME_LABEL[game.regime]}</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>{REGIME_DESCRIPTION[game.regime]}</p>
        </div>
        {game.aiTotal > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)", margin: "0 0 2px" }}>AI Accuracy</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: sage, margin: 0 }}>
              {Math.round((game.aiCorrect / game.aiTotal) * 100)}%
              <span style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 400 }}> ({game.aiCorrect}/{game.aiTotal})</span>
            </p>
          </div>
        )}
      </div>

      <div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-4)", margin: "0 0 5px" }}>Round {game.round} · Neural Net Analysis</p>
        <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 26, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
          Pick your <em>positions</em>
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {game.cards.map(card => (
          <StrategyCard
            key={card.id}
            card={card}
            amount={amounts[card.id] ?? ""}
            balance={game.balance}
            onAmount={val => setAmount(card.id, val)}
            onKelly={() => handleKellyFor(card.id, card.kellyFraction)}
            onMax={() => handleMaxFor(card.id)}
          />
        ))}
      </div>

      {/* Footer bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 22px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12,
        position: "sticky", bottom: 24,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Allocated", val: `$${total.toFixed(2)}`, color: total > 0 ? "var(--text)" : "var(--text-4)" },
            { label: "Available", val: `$${game.balance.toFixed(2)}`, color: sage },
            { label: "Kelly Total", val: `$${kellyNorm.toFixed(2)}`, color: bot },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>{m.label}</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, margin: 0, color: m.color }}>{m.val}</p>
            </div>
          ))}
        </div>
        {over && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: red, margin: 0 }}>Over by ${(-remaining).toFixed(2)}</p>}
        <button
          onClick={submit}
          disabled={total <= 0 || over}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 30px", borderRadius: 999, border: "none",
            cursor: total <= 0 || over ? "not-allowed" : "pointer",
            background: total <= 0 || over ? "var(--surface-3)" : sage,
            color: total <= 0 || over ? "var(--text-4)" : "#0C0D0F",
            fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.12em", transition: "all 0.15s",
          }}
        >Run Simulation →</button>
      </div>
    </div>
  );
}

// ── Results phase ─────────────────────────────────────────────────────────────
function ResultsPhase({ round, game, won, broke, onContinue }: {
  round: RoundResult; game: GameState; won: boolean; broke: boolean; onContinue: () => void;
}) {
  const pnl = round.totalProfit;
  const regimeColor = REGIME_COLOR[round.regime];
  const playerAhead = round.endBalance >= round.botEndBalance;
  const delta = Math.abs(game.balance - game.botBalance);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {won && (
        <div style={{ padding: "40px 32px", background: "rgba(61,204,145,0.06)", border: "1px solid rgba(61,204,145,0.3)", borderRadius: 18, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 14, filter: "drop-shadow(0 0 20px rgba(61,204,145,0.5))" }}>🎉</div>
          <p className="mm-shimmer-text" style={{ fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, letterSpacing: "-0.03em", display: "block", marginBottom: 10 }}>You hit $1,000!</p>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 6px" }}>$20 → ${round.endBalance.toFixed(2)} in {round.round} round{round.round !== 1 ? "s" : ""}</p>
          <p style={{ fontSize: 13, color: "var(--text-4)", margin: "0 0 28px" }}>
            You {playerAhead ? "beat" : "lost to"} the Kelly bot · Bot ended at ${round.botEndBalance.toFixed(2)}
          </p>
          <button onClick={onContinue} style={{ padding: "13px 36px", borderRadius: 999, border: "none", background: sage, color: "#0C0D0F", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>Play Again →</button>
        </div>
      )}

      {broke && !won && (
        <div style={{ padding: "40px 32px", background: "rgba(255,90,90,0.06)", border: "1px solid rgba(255,90,90,0.3)", borderRadius: 18, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>💀</div>
          <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 48, letterSpacing: "-0.03em", color: red, margin: "0 0 10px" }}>Liquidated.</p>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 4px" }}>You made it {round.round} round{round.round !== 1 ? "s" : ""}.</p>
          <p style={{ fontSize: 13, color: "var(--text-4)", margin: "0 0 28px" }}>The Kelly bot ended at ${round.botEndBalance.toFixed(2)}.</p>
          <button onClick={onContinue} style={{ padding: "13px 36px", borderRadius: 999, border: "none", background: red, color: "#fff", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>Try Again →</button>
        </div>
      )}

      {!won && !broke && (
        <>
          {/* Regime pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: `${regimeColor}0D`, border: `1px solid ${regimeColor}25`, borderRadius: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: regimeColor, boxShadow: `0 0 6px ${regimeColor}`, flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.16em", color: regimeColor }}>{REGIME_LABEL[round.regime]}</span>
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-4)", margin: "0 0 4px" }}>Round {round.round} · Results</p>
              <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 26, letterSpacing: "-0.02em", margin: 0 }}>Position <em>Breakdown</em></h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)", margin: "0 0 3px" }}>Your P&L</p>
              <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 32, letterSpacing: "-0.03em", margin: 0, color: pnl >= 0 ? sage : red }}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 100px 80px", gap: 12, padding: "6px 18px", fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)" }}>
            <span>Position</span><span style={{ textAlign: "right" }}>Invested</span><span style={{ textAlign: "right" }}>Return</span><span style={{ textAlign: "right" }}>P&L</span><span style={{ textAlign: "right" }}>AI</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {round.positions.map(pos => {
              const prof = pos.profit >= 0;
              const color = prof ? sage : red;
              return (
                <div key={pos.strategyId} style={{
                  display: "grid", gridTemplateColumns: "1fr 90px 90px 100px 80px",
                  gap: 12, padding: "14px 18px", borderRadius: 10, alignItems: "center",
                  background: prof ? "rgba(61,204,145,0.04)" : "rgba(255,90,90,0.04)",
                  border: `1px solid ${prof ? "rgba(61,204,145,0.14)" : "rgba(255,90,90,0.14)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{pos.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", lineHeight: 1 }}>{pos.name}</p>
                      <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--text-4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{CATEGORY_LABEL[pos.category]}</p>
                    </div>
                  </div>
                  <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, margin: 0, color: "var(--text-3)" }}>${pos.amountInvested.toFixed(2)}</p>
                  {pos.isBinary ? (
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: pos.wasWin ? "rgba(61,204,145,0.15)" : "rgba(255,90,90,0.15)", color: pos.wasWin ? sage : red }}>
                        {pos.wasWin ? "WIN" : "LOSS"}
                      </span>
                    </div>
                  ) : (
                    <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, margin: 0, color }}>{pos.returnPct >= 0 ? "+" : ""}{pos.returnPct.toFixed(1)}%</p>
                  )}
                  <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, margin: 0, color }}>{pos.profit >= 0 ? "+" : ""}${pos.profit.toFixed(2)}</p>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: pos.aiWasRight ? sage : "var(--text-4)" }}>
                      {pos.aiWasRight ? "✓ Right" : "✗ Wrong"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* You vs Bot */}
          <div style={{ padding: "20px 24px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 14 }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 14px" }}>
              You vs Kelly Bot · This Round
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0, alignItems: "start" }}>
              {/* You */}
              <div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: sage, margin: "0 0 4px" }}>You</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: pnl >= 0 ? sage : red }}>
                  {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-4)", margin: 0 }}>
                  Balance: ${round.endBalance.toFixed(2)}
                </p>
              </div>
              {/* Divider */}
              <div style={{ width: 1, background: "var(--line)", margin: "0 20px", alignSelf: "stretch" }} />
              {/* Bot */}
              <div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: bot, margin: "0 0 4px" }}>Kelly Bot</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: round.botProfit >= 0 ? bot : red }}>
                  {round.botProfit >= 0 ? "+" : ""}${round.botProfit.toFixed(2)}
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-4)", margin: 0 }}>
                  Balance: ${round.botEndBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Round verdict */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              {pnl > round.botProfit ? (
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: sage, margin: 0 }}>
                  ↑ You beat the bot by ${(pnl - round.botProfit).toFixed(2)} this round. Nice sizing.
                </p>
              ) : pnl < round.botProfit ? (
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: 0 }}>
                  Bot outperformed by ${(round.botProfit - pnl).toFixed(2)}. Kelly sizing was more precise.
                </p>
              ) : (
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: 0 }}>
                  Tied with the bot this round.
                </p>
              )}
            </div>
          </div>

          {/* AI accuracy */}
          {game.aiTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
              <div>
                <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", margin: "0 0 6px" }}>Neural Net · Running Accuracy</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 120, height: 4, background: "var(--surface-3)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((game.aiCorrect / game.aiTotal) * 100)}%`, background: `linear-gradient(90deg, ${sage}80, ${sage})`, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: sage }}>{Math.round((game.aiCorrect / game.aiTotal) * 100)}%</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)" }}>{game.aiCorrect}/{game.aiTotal} calls correct</span>
                </div>
              </div>
            </div>
          )}

          {/* Continue bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 2px" }}>New Balance</p>
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

// ── Game init ─────────────────────────────────────────────────────────────────
function initGame(): GameState {
  const regime = randomStartRegime();
  return {
    phase: "allocate", round: 1,
    balance: STARTING_BALANCE, botBalance: STARTING_BALANCE,
    regime, cards: generateCards(regime),
    history: [], aiCorrect: 0, aiTotal: 0,
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GamePage() {
  const [game, setGame] = useState<GameState>(initGame);
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [won, setWon] = useState(false);
  const [broke, setBroke] = useState(false);

  const reset = useCallback(() => {
    setGame(initGame()); setLastRound(null); setWon(false); setBroke(false);
  }, []);

  function handleSimulate(allocs: Allocation[]) {
    const result = simulateRound(game.round, game.regime, game.balance, game.botBalance, game.cards, allocs);
    const recommended = game.cards.find(c => c.isRecommended);
    const recResult = result.positions.find(p => p.strategyId === recommended?.id);
    const aiRight = recResult?.aiWasRight ?? false;
    const hasRec = Boolean(recResult);
    setLastRound(result);
    setWon(result.endBalance >= TARGET_BALANCE);
    setBroke(result.endBalance < 0.01);
    setGame(prev => ({
      ...prev, phase: "results",
      balance: result.endBalance,
      botBalance: result.botEndBalance,
      history: [...prev.history, result],
      aiCorrect: prev.aiCorrect + (hasRec && aiRight ? 1 : 0),
      aiTotal: prev.aiTotal + (hasRec ? 1 : 0),
    }));
  }

  function handleContinue() {
    if (won || broke) { reset(); return; }
    const newRegime = nextRegime(game.regime);
    setGame(prev => ({
      ...prev, phase: "allocate", round: prev.round + 1,
      regime: newRegime, cards: generateCards(newRegime),
    }));
    setLastRound(null);
  }

  const pct = Math.min((game.balance / TARGET_BALANCE) * 100, 100);
  const botPct = Math.min((game.botBalance / TARGET_BALANCE) * 100, 100);
  const playerAhead = game.balance >= game.botBalance;
  const delta = Math.abs(game.balance - game.botBalance);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* HUD */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(12,13,15,0.92)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "12px 0 10px" }}>
            <Link href="/moneymatrix" style={{ textDecoration: "none", marginRight: "auto" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--text)" }}>
                Money<em className="mm-shimmer-em">Matrix</em>
              </span>
            </Link>

            <div style={{ textAlign: "center", padding: "0 20px", borderLeft: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>Round</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, margin: 0 }}>{game.round}</p>
            </div>

            <div style={{ textAlign: "center", padding: "0 20px", borderLeft: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>You</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, margin: 0, color: sage }}>
                <BalanceCounter value={game.balance} />
              </p>
            </div>

            <div style={{ textAlign: "center", padding: "0 20px", borderLeft: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>Kelly Bot</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, margin: 0, color: bot }}>
                <BalanceCounter value={game.botBalance} color={bot} />
              </p>
            </div>

            <div style={{ textAlign: "center", padding: "0 20px", borderLeft: "1px solid var(--line)" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)", margin: "0 0 1px" }}>
                {playerAhead ? "Ahead" : "Behind"}
              </p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, margin: 0, color: playerAhead ? sage : red }}>
                {playerAhead ? "+" : "−"}${delta.toFixed(2)}
              </p>
            </div>

            <div style={{ padding: "0 0 0 20px", borderLeft: "1px solid var(--line)" }}>
              <button onClick={reset} style={{ fontFamily: "var(--mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)", background: "none", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 14px", cursor: "pointer" }}>Reset</button>
            </div>
          </div>

          {/* Dual progress bars: you (green) and bot (purple) */}
          <div style={{ position: "relative", height: 3, background: "var(--surface-3)", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${botPct}%`, background: bot, opacity: 0.4, transition: "width 0.8s ease" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${sage}, ${gold})`, transition: "width 0.8s ease" }} />
          </div>
        </div>
      </header>

      {/* Main */}
      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 1080, width: "100%", margin: "0 auto", padding: "32px 32px 100px", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Sparkline — you (green) vs bot (purple) */}
          {game.history.length >= 2 && (
            <div style={{ padding: "16px 22px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", margin: 0 }}>Portfolio History</p>
                <div style={{ display: "flex", gap: 16, fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--text-4)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 2, background: sage, borderRadius: 2, display: "inline-block" }} />You</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 1, borderTop: `2px dashed ${bot}`, borderRadius: 2, display: "inline-block", opacity: 0.7 }} />Kelly Bot</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 1, background: gold, borderRadius: 2, display: "inline-block", opacity: 0.5 }} />$1K goal</span>
                </div>
              </div>
              <div style={{ height: 60 }}><Sparkline history={game.history} /></div>
            </div>
          )}

          {game.phase === "allocate" && <AllocationPhase game={game} onSimulate={handleSimulate} />}
          {game.phase === "results" && lastRound && <ResultsPhase round={lastRound} game={game} won={won} broke={broke} onContinue={handleContinue} />}
        </div>
      </div>
    </div>
  );
}
