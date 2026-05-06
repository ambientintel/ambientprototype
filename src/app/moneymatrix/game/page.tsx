"use client";
import { useState, useId, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  GameState, StrategyCard as StrategyCardType, Allocation, RoundResult,
} from "./_types";
import {
  nextRegime, randomStartRegime, generateCards, simulateRound,
  REGIME_LABEL, REGIME_COLOR, REGIME_DESCRIPTION,
  CATEGORY_LABEL, RISK_COLOR, RISK_LABEL,
  STARTING_BALANCE, TARGET_BALANCE, regimeForecast,
} from "./_engine";
import "../moneymatrix.css";

const sage = "#3DCC91";
const red  = "#FF5A5A";
const gold = "#FFB347";
const botC = "#C77DFF";

// ── Category short codes ──────────────────────────────────────────────────────
const CAT_CODE: Record<string, string> = {
  prediction: "PRED MKT", crypto: "CRYPTO", equity: "EQUITY",
  quant: "ALGO", macro: "MACRO",
};

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ value, prefix = "$", decimals = 2 }: { value: number; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current; const end = value; const t0 = performance.now(); const dur = 600;
    function tick(now: number) {
      const t = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * ease);
      if (t < 1) requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

// ── Ambient network SVG (from landing page) ───────────────────────────────────
function NetworkAmbient() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <style>{`
        .gb { stroke: rgba(61,204,145,1); stroke-width: 0.5; fill: none; opacity: 0.04; }
        .gl { stroke: rgba(61,204,145,1); stroke-width: 1.0; fill: none; stroke-dasharray: 16 700; }
        .gl1 { animation: gf  9.0s linear infinite; opacity: 0.18; }
        .gl2 { animation: gf 12.0s linear infinite; animation-delay:-5s; opacity: 0.14; }
        .gl3 { animation: gf  8.0s linear infinite; animation-delay:-2s; opacity: 0.16; }
        .gl4 { animation: gf 11.0s linear infinite; animation-delay:-7s; opacity: 0.12; }
        .gl5 { animation: gf 10.0s linear infinite; animation-delay:-3s; opacity: 0.14; }
        @keyframes gf { from { stroke-dashoffset: 716; } to { stroke-dashoffset: 0; } }
        .gn { fill: rgba(61,204,145,1); opacity: 0.10; }
      `}</style>
      <line x1="180"  y1="720" x2="520"  y2="580" className="gb" />
      <line x1="520"  y1="580" x2="380"  y2="420" className="gb" />
      <line x1="380"  y1="420" x2="700"  y2="350" className="gb" />
      <line x1="700"  y1="350" x2="980"  y2="480" className="gb" />
      <line x1="980"  y1="480" x2="1200" y2="360" className="gb" />
      <line x1="1200" y1="360" x2="1380" y2="480" className="gb" />
      <line x1="700"  y1="350" x2="1200" y2="360" className="gb" />
      <line x1="180"  y1="720" x2="520"  y2="580" className="gl gl1" />
      <line x1="520"  y1="580" x2="380"  y2="420" className="gl gl2" />
      <line x1="380"  y1="420" x2="700"  y2="350" className="gl gl3" />
      <line x1="700"  y1="350" x2="980"  y2="480" className="gl gl4" />
      <line x1="980"  y1="480" x2="1200" y2="360" className="gl gl5" />
      <circle cx="380"  cy="420" r="2.5" className="gn" />
      <circle cx="700"  cy="350" r="3"   className="gn" />
      <circle cx="980"  cy="480" r="2.5" className="gn" />
      <circle cx="1200" cy="360" r="3"   className="gn" />
    </svg>
  );
}

// ── Sparkline with bot curve ──────────────────────────────────────────────────
function Sparkline({ history }: { history: RoundResult[] }) {
  const uid = useId();
  if (history.length < 1) return null;
  const pts    = history.length === 1
    ? [STARTING_BALANCE, history[0].endBalance]
    : [STARTING_BALANCE, ...history.map(r => r.endBalance)];
  const botPts = history.length === 1
    ? [STARTING_BALANCE, history[0].botEndBalance]
    : [STARTING_BALANCE, ...history.map(r => r.botEndBalance)];
  const cap = Math.max(TARGET_BALANCE, ...pts, ...botPts) * 1.08;
  const W = 480; const H = 56; const P = 6;
  const toC = (vals: number[]) => vals.map((v, i) => [
    P + (i / (vals.length - 1)) * (W - P * 2),
    H - P - (v / cap) * (H - P * 2),
  ]);
  const pathD = (coords: number[][], close = false) => {
    let d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    if (close) d += ` L${coords[coords.length-1][0].toFixed(1)},${(H-P).toFixed(1)} L${P},${(H-P).toFixed(1)} Z`;
    return d;
  };
  const pC = toC(pts); const bC = toC(botPts);
  const tY = H - P - (TARGET_BALANCE / cap) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={`pg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sage} stopOpacity="0.18" />
          <stop offset="100%" stopColor={sage} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={P} y1={tY} x2={W-P} y2={tY} stroke={gold} strokeWidth="0.8" strokeDasharray="3,4" opacity="0.3" />
      <path d={pathD(pC, true)} fill={`url(#pg-${uid})`} />
      <path d={pathD(bC)} fill="none" stroke={botC} strokeWidth="1.2" strokeDasharray="4,3" opacity="0.55" />
      <path d={pathD(pC)} fill="none" stroke={sage} strokeWidth="1.8" strokeLinejoin="round" />
      {pC.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill={sage} />)}
    </svg>
  );
}

// ── Thin data bar ─────────────────────────────────────────────────────────────
function DataBar({ pct, color = sage }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 2, background: "rgba(255,255,255,0.06)", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: color, transition: "width 0.3s" }} />
    </div>
  );
}

// ── Kelly sizing indicator ────────────────────────────────────────────────────
function KellyBar({ kellyAmt, playerAmt }: { kellyAmt: number; playerAmt: number }) {
  if (kellyAmt <= 0 || playerAmt <= 0) return null;
  const ratio = playerAmt / kellyAmt;
  const pct = Math.min((ratio / 2) * 100, 100);
  const color = ratio >= 0.85 && ratio <= 1.15 ? sage : ratio > 1.5 ? red : gold;
  const label = ratio >= 0.85 && ratio <= 1.15 ? "AT KELLY" : ratio > 1.5 ? "OVERSIZED" : ratio < 0.5 ? "UNDERSIZED" : "NEAR KELLY";
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ position: "relative", height: 2, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, transition: "width 0.2s, background 0.2s" }} />
        <div style={{ position: "absolute", left: "50%", top: -3, height: 8, width: 1, background: sage, opacity: 0.6 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 7.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>0</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 7.5, color: color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 7.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>2×</span>
      </div>
    </div>
  );
}

// ── Strategy card ─────────────────────────────────────────────────────────────
function StrategyCard({ card, amount, balance, onAmount, onKelly, onMax }: {
  card: StrategyCardType; amount: string; balance: number;
  onAmount: (v: string) => void; onKelly: () => void; onMax: () => void;
}) {
  const amt = parseFloat(amount) || 0;
  const active = amt > 0;
  const disabled = balance < card.minCapital;
  const kellyAmt = card.kellyFraction * balance;
  const hasKelly = card.kellyFraction > 0.01;
  const riskColor = RISK_COLOR[card.riskTier] ?? gold;
  const confColor = card.confidence >= 78 ? sage : card.confidence >= 58 ? gold : "var(--text-3)";

  return (
    <div style={{
      background: active ? "rgba(61,204,145,0.03)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${card.isRecommended ? "rgba(61,204,145,0.4)" : active ? "rgba(61,204,145,0.18)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 2,
      display: "flex", flexDirection: "column",
      opacity: disabled ? 0.35 : 1,
      transition: "background 0.2s, border-color 0.2s",
      boxShadow: card.isRecommended ? "0 0 40px rgba(61,204,145,0.08)" : "none",
      overflow: "hidden",
    }}>

      {/* Recommended stripe */}
      {card.isRecommended && (
        <div style={{ height: 2, background: `linear-gradient(90deg, ${sage}, transparent)` }} />
      )}

      {/* Card body */}
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* Top: category + risk */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-4)" }}>
            {CAT_CODE[card.category]}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.12em", color: riskColor }}>
            {RISK_LABEL[card.riskTier].toUpperCase()} RISK
          </span>
        </div>

        {/* Confidence + name */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Confidence number */}
          <div style={{ flexShrink: 0, width: 54 }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 48, fontWeight: 700, lineHeight: 1,
              letterSpacing: "-0.04em", color: confColor,
            }}>
              {card.confidence}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginTop: 4 }}>
              SIGNAL
            </div>
            <div style={{ marginTop: 5 }}>
              <DataBar pct={card.confidence} color={confColor} />
            </div>
          </div>
          {/* Name block */}
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{
              fontFamily: "var(--serif)", fontWeight: 600, fontSize: 18,
              lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: 6,
            }}>
              {card.name}
            </div>
            {card.isRecommended && (
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: sage, marginBottom: 4 }}>
                ● RECOMMENDED SIGNAL
              </div>
            )}
          </div>
        </div>

        {/* Thesis */}
        <p style={{
          fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.6, margin: 0,
          fontStyle: "italic", borderLeft: "2px solid rgba(255,255,255,0.07)",
          paddingLeft: 10,
        }}>
          {card.thesis}
        </p>

        {/* Separator */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        {/* Range row */}
        {card.isBinary ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 3 }}>OUTCOME</div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: red }}>LOSS −100%</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, color: "var(--text-4)", alignSelf: "center" }}>·</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: sage }}>WIN +{Math.round(((card.payoutMultiplier ?? 1.9) - 1) * 100)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", marginBottom: 6 }}>RETURN RANGE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: (card.minReturn ?? 0) < 0 ? red : sage, minWidth: 42 }}>
                {(card.minReturn ?? 0) > 0 ? "+" : ""}{card.minReturn ?? 0}%
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,90,90,0.4), rgba(61,204,145,0.4))" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: sage, minWidth: 42, textAlign: "right" }}>
                +{card.maxReturn ?? 0}%
              </span>
            </div>
          </div>
        )}

        {/* Kelly row */}
        {!disabled && (
          <div style={{
            padding: "10px 12px",
            background: hasKelly ? "rgba(61,204,145,0.04)" : "rgba(255,90,90,0.04)",
            border: `1px solid ${hasKelly ? "rgba(61,204,145,0.12)" : "rgba(255,90,90,0.10)"}`,
            borderRadius: 2,
          }}>
            {hasKelly ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: sage }}>KELLY OPTIMAL</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: sage }}>${kellyAmt.toFixed(2)}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-4)" }}>{(card.kellyFraction * 100).toFixed(1)}%</span>
                  </div>
                </div>
                {amt > 0 && <KellyBar kellyAmt={kellyAmt} playerAmt={amt} />}
              </>
            ) : (
              <span style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: red }}>
                NO EDGE · KELLY = $0.00
              </span>
            )}
          </div>
        )}
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Allocation input */}
      {!disabled ? (
        <div style={{ padding: "12px 20px", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-4)", pointerEvents: "none" }}>$</span>
            <input
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount}
              onChange={e => onAmount(e.target.value)}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", color: "var(--text)",
                border: `1px solid ${active ? "rgba(61,204,145,0.35)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 2, padding: "8px 10px 8px 24px",
                fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          </div>
          {hasKelly && (
            <button onClick={onKelly} style={{
              fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em",
              color: sage, background: "rgba(61,204,145,0.08)", border: "1px solid rgba(61,204,145,0.25)",
              borderRadius: 2, padding: "8px 10px", cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}>Kelly</button>
          )}
          <button onClick={onMax} style={{
            fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em",
            color: "var(--text-4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 2, padding: "8px 10px", cursor: "pointer", whiteSpace: "nowrap",
          }}>All</button>
        </div>
      ) : (
        <div style={{ padding: "12px 20px" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)" }}>
            MIN CAPITAL ${card.minCapital}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Allocation phase ──────────────────────────────────────────────────────────
function AllocationPhase({ game, onSimulate }: { game: GameState; onSimulate: (a: Allocation[]) => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const total = Object.values(amounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const remaining = Math.round((game.balance - total) * 100) / 100;
  const over = remaining < -0.01;
  const regimeColor = REGIME_COLOR[game.regime];

  function setAmt(id: string, val: string) { setAmounts(p => ({ ...p, [id]: val })); }
  function handleMax(id: string) {
    const others = Object.entries(amounts).filter(([k]) => k !== id).reduce((s, [, v]) => s + (parseFloat(v) || 0), 0);
    setAmounts(p => ({ ...p, [id]: String(Math.max(0, Math.round((game.balance - others) * 100) / 100)) }));
  }
  function handleKelly(id: string, fraction: number) {
    setAmounts(p => ({ ...p, [id]: String(Math.min(game.balance, Math.round(fraction * game.balance * 100) / 100)) }));
  }
  function submit() {
    const allocs = game.cards.map(c => ({ strategyId: c.id, amount: parseFloat(amounts[c.id] ?? "") || 0 })).filter(a => a.amount > 0);
    if (!allocs.length || over) return;
    onSimulate(allocs);
    setAmounts({});
  }

  const kellyTotal = Math.min(game.balance, game.cards.reduce((s, c) => s + c.kellyFraction * game.balance, 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Regime strip */}
      <div style={{ borderLeft: `3px solid ${regimeColor}`, paddingLeft: 20, paddingTop: 4, paddingBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.2em", color: regimeColor }}>
            MARKET REGIME
          </span>
          <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 22, fontWeight: 300, color: regimeColor, letterSpacing: "-0.01em" }}>
            {REGIME_LABEL[game.regime]}
          </span>
          {game.aiTotal > 0 && (
            <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)" }}>
              AI ACCURACY <span style={{ color: sage, fontWeight: 700 }}>{Math.round((game.aiCorrect / game.aiTotal) * 100)}%</span>
            </span>
          )}
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-4)", margin: 0, lineHeight: 1.5 }}>
          {REGIME_DESCRIPTION[game.regime]}
        </p>
      </div>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-4)", margin: "0 0 6px" }}>
            RND {String(game.round).padStart(2, "0")} · NEURAL SIGNAL ANALYSIS
          </p>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 30, letterSpacing: "-0.03em", margin: 0 }}>
            Position <em>Entry</em>
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", margin: "0 0 2px" }}>CAPITAL AVAILABLE</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, margin: 0, color: sage }}>
            ${game.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Strategy grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {game.cards.map(card => (
          <StrategyCard key={card.id} card={card} amount={amounts[card.id] ?? ""} balance={game.balance}
            onAmount={v => setAmt(card.id, v)}
            onKelly={() => handleKelly(card.id, card.kellyFraction)}
            onMax={() => handleMax(card.id)}
          />
        ))}
      </div>

      {/* Order bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2,
        position: "sticky", bottom: 24,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "COMMITTED", val: `$${total.toFixed(2)}`, color: total > 0 ? "var(--text)" : "var(--text-4)" },
            { label: "AVAILABLE", val: `$${game.balance.toFixed(2)}`, color: sage },
            { label: "KELLY TOTAL", val: `$${kellyTotal.toFixed(2)}`, color: botC },
            { label: "RESERVE", val: `$${remaining.toFixed(2)}`, color: over ? red : "var(--text-4)" },
          ].map(m => (
            <div key={m.label}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 7.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 3px" }}>{m.label}</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, margin: 0, color: m.color }}>{m.val}</p>
            </div>
          ))}
        </div>
        {over && <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: red, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>OVER BY ${(-remaining).toFixed(2)}</p>}
        <button
          onClick={submit} disabled={total <= 0 || over}
          style={{
            padding: "12px 32px", borderRadius: 2, border: "none",
            cursor: total <= 0 || over ? "not-allowed" : "pointer",
            background: total <= 0 || over ? "rgba(255,255,255,0.05)" : sage,
            color: total <= 0 || over ? "var(--text-4)" : "#0A0B0D",
            fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.16em", transition: "all 0.2s",
            boxShadow: total > 0 && !over ? `0 0 28px ${sage}55` : "none",
          }}
        >EXECUTE ORDER</button>
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

  if (won) return (
    <div style={{ padding: "60px 48px", textAlign: "center", border: "1px solid rgba(61,204,145,0.2)", borderRadius: 2, background: "rgba(61,204,145,0.03)" }}>
      <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.24em", color: sage, margin: "0 0 16px" }}>
        ACCOUNT TARGET REACHED · {round.round} ROUND{round.round !== 1 ? "S" : ""}
      </p>
      <p className="mm-shimmer-text" style={{ display: "block", fontSize: "clamp(56px,7vw,96px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", lineHeight: 1 }}>
        $1,000
      </p>
      <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 18, color: "var(--text-3)", margin: "0 0 8px" }}>
        You turned $20 into ${round.endBalance.toFixed(2)}.
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: "0 0 36px" }}>
        KELLY BOT ENDED AT ${round.botEndBalance.toFixed(2)} · {game.balance >= game.botBalance ? "YOU BEAT THE BOT" : "BOT WON"}
      </p>
      <button onClick={onContinue} style={{ padding: "12px 40px", borderRadius: 2, border: `1px solid ${sage}`, background: "transparent", color: sage, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", cursor: "pointer" }}>
        NEW GAME
      </button>
    </div>
  );

  if (broke) return (
    <div style={{ padding: "60px 48px", textAlign: "center", border: "1px solid rgba(255,90,90,0.2)", borderRadius: 2, background: "rgba(255,90,90,0.03)" }}>
      <p style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.24em", color: red, margin: "0 0 16px" }}>
        ACCOUNT LIQUIDATED · {round.round} ROUND{round.round !== 1 ? "S" : ""}
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 80, fontWeight: 700, letterSpacing: "-0.05em", color: red, margin: "0 0 16px", lineHeight: 1 }}>
        $0.00
      </p>
      <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 16, color: "var(--text-4)", margin: "0 0 8px" }}>
        Kelly bot ended at ${round.botEndBalance.toFixed(2)}.
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: "0 0 36px" }}>
        POOR POSITION SIZING IS HOW RETAIL LOSES. FOLLOW KELLY.
      </p>
      <button onClick={onContinue} style={{ padding: "12px 40px", borderRadius: 2, border: `1px solid ${red}`, background: "transparent", color: red, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", cursor: "pointer" }}>
        RETRY
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Settlement header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: regimeColor, boxShadow: `0 0 6px ${regimeColor}` }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.18em", color: regimeColor }}>{REGIME_LABEL[round.regime]}</span>
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-4)", margin: "0 0 5px" }}>
            RND {String(round.round).padStart(2, "0")} · SETTLEMENT
          </p>
          <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.03em", margin: 0 }}>
            Position <em>Breakdown</em>
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", margin: "0 0 4px" }}>YOUR P&L</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: "-0.04em", color: pnl >= 0 ? sage : red }}>
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Trade table */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 110px 110px 80px", gap: 0, padding: "8px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {["STRATEGY", "CAPITAL", "RETURN", "P&L", "SIGNAL"].map((h, i) => (
            <span key={h} style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", textAlign: i > 0 ? "right" : "left" }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {round.positions.map((pos, idx) => {
          const prof = pos.profit >= 0;
          const color = prof ? sage : red;
          return (
            <div key={pos.strategyId} style={{
              display: "grid", gridTemplateColumns: "1fr 100px 110px 110px 80px",
              gap: 0, padding: "14px 20px", alignItems: "center",
              borderBottom: idx < round.positions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: prof ? "rgba(61,204,145,0.025)" : "rgba(255,90,90,0.025)",
            }}>
              <div>
                <p style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 600, margin: "0 0 2px", letterSpacing: "-0.01em" }}>{pos.name}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em" }}>{CAT_CODE[pos.category]}</p>
              </div>
              <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, margin: 0, color: "var(--text-3)" }}>${pos.amountInvested.toFixed(2)}</p>
              {pos.isBinary ? (
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 2, background: pos.wasWin ? "rgba(61,204,145,0.12)" : "rgba(255,90,90,0.12)", color: pos.wasWin ? sage : red }}>
                    {pos.wasWin ? "WIN" : "LOSS"}
                  </span>
                </div>
              ) : (
                <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, margin: 0, color }}>{pos.returnPct >= 0 ? "+" : ""}{pos.returnPct.toFixed(1)}%</p>
              )}
              <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, margin: 0, color }}>{pos.profit >= 0 ? "+" : ""}${pos.profit.toFixed(2)}</p>
              <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 8.5, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em", color: pos.aiWasRight ? sage : "var(--text-4)" }}>
                {pos.aiWasRight ? "✓ CORRECT" : "✗ WRONG"}
              </p>
            </div>
          );
        })}
      </div>

      {/* You vs Bot */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
        <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-4)" }}>YOU VS KELLY BOT · ROUND {round.round}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", padding: 0 }}>
          {/* You */}
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: sage, margin: "0 0 8px" }}>YOUR POSITION</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 4px", color: pnl >= 0 ? sage : red }}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: 0 }}>BALANCE ${round.endBalance.toFixed(2)}</p>
          </div>
          {/* Divider */}
          <div style={{ background: "rgba(255,255,255,0.07)" }} />
          {/* Bot */}
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: botC, margin: "0 0 8px" }}>KELLY BOT</p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 4px", color: round.botProfit >= 0 ? botC : red }}>
              {round.botProfit >= 0 ? "+" : ""}${round.botProfit.toFixed(2)}
            </p>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: 0 }}>BALANCE ${round.botEndBalance.toFixed(2)}</p>
          </div>
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.01)" }}>
          {pnl > round.botProfit
            ? <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: sage }}>YOU OUTPERFORMED THE BOT BY ${(pnl - round.botProfit).toFixed(2)} THIS ROUND. DISCIPLINED SIZING.</span>
            : pnl < round.botProfit
              ? <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)" }}>BOT OUTPERFORMED BY ${(round.botProfit - pnl).toFixed(2)}. KELLY CRITERION WOULD HAVE SIZED DIFFERENTLY.</span>
              : <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--text-4)" }}>MATCHED THE BOT THIS ROUND.</span>
          }
        </div>
      </div>

      {/* Regime forecast */}
      {!won && !broke && (() => {
        const forecasts = regimeForecast(round.regime);
        return (
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-4)" }}>NEXT REGIME FORECAST · MARKOV TRANSITION</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)", letterSpacing: "0.1em" }}>CURRENT: <span style={{ color: REGIME_COLOR[round.regime] }}>{REGIME_LABEL[round.regime].toUpperCase()}</span></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${forecasts.length}, 1fr)`, padding: "16px 20px", gap: 12 }}>
              {forecasts.map(({ regime, prob }) => {
                const rc = REGIME_COLOR[regime];
                return (
                  <div key={regime}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--serif)", fontSize: 12, fontStyle: "italic", color: rc }}>{REGIME_LABEL[regime]}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: rc }}>{Math.round(prob * 100)}%</span>
                    </div>
                    <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: "100%", width: `${Math.round(prob * 100)}%`, background: rc, opacity: 0.7 }} />
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)", margin: "5px 0 0", lineHeight: 1.4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {REGIME_DESCRIPTION[regime].split(".")[0]}.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* AI accuracy */}
      {game.aiTotal > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 20px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-4)" }}>NEURAL NET ACCURACY</span>
          <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)" }}>
            <div style={{ height: "100%", width: `${Math.round((game.aiCorrect / game.aiTotal) * 100)}%`, background: sage }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: sage }}>{Math.round((game.aiCorrect / game.aiTotal) * 100)}%</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-4)" }}>{game.aiCorrect}/{game.aiTotal}</span>
        </div>
      )}

      {/* Continue bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
        <div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 3px" }}>NEW BALANCE</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>${round.endBalance.toFixed(2)}</p>
        </div>
        <button onClick={onContinue} style={{ padding: "12px 32px", borderRadius: 2, border: `1px solid ${sage}`, background: "transparent", color: sage, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", cursor: "pointer" }}>
          ROUND {round.round + 1}
        </button>
      </div>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GamePage() {
  const [game, setGame] = useState<GameState>(initGame);
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [won, setWon] = useState(false);
  const [broke, setBroke] = useState(false);

  const reset = useCallback(() => { setGame(initGame()); setLastRound(null); setWon(false); setBroke(false); }, []);

  function handleSimulate(allocs: Allocation[]) {
    const result = simulateRound(game.round, game.regime, game.balance, game.botBalance, game.cards, allocs);
    const recommended = game.cards.find(c => c.isRecommended);
    const hasRec = Boolean(recommended);
    const aiRight = recommended
      ? (recommended.isBinary ? recommended.sealedWin === true : recommended.sealedReturnPct > 0)
      : false;
    setLastRound(result);
    setWon(result.endBalance >= TARGET_BALANCE);
    setBroke(result.endBalance < 0.01);
    setGame(prev => ({
      ...prev, phase: "results",
      balance: result.endBalance, botBalance: result.botEndBalance,
      history: [...prev.history, result],
      aiCorrect: prev.aiCorrect + (hasRec && aiRight ? 1 : 0),
      aiTotal: prev.aiTotal + (hasRec ? 1 : 0),
    }));
  }

  function handleContinue() {
    if (won || broke) { reset(); return; }
    const newRegime = nextRegime(game.regime);
    setGame(prev => ({ ...prev, phase: "allocate", round: prev.round + 1, regime: newRegime, cards: generateCards(newRegime) }));
    setLastRound(null);
  }

  const pct    = Math.min((game.balance / TARGET_BALANCE) * 100, 100);
  const botPct = Math.min((game.botBalance / TARGET_BALANCE) * 100, 100);
  const delta  = game.balance - game.botBalance;

  return (
    <div style={{
      background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh",
      display: "flex", flexDirection: "column", position: "relative",
      backgroundImage: "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
      backgroundSize: "72px 72px",
    }}>
      <NetworkAmbient />

      {/* Aurora orbs */}
      <div style={{ position: "fixed", top: "15%", right: "8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(61,204,145,0.055) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "20%", left: "5%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(199,125,255,0.04) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", zIndex: 0 }} />

      {/* HUD */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,11,13,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "11px 0 9px", gap: 0 }}>

            <Link href="/moneymatrix" style={{ textDecoration: "none", marginRight: "auto" }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 400, letterSpacing: "-0.01em", color: "var(--text)" }}>
                Money<em className="mm-shimmer-em">Matrix</em>
              </span>
            </Link>

            {[
              { label: "ROUND", val: String(game.round).padStart(2, "0"), color: "var(--text)" },
              { label: "YOU", val: null, color: sage },
              { label: "KELLY BOT", val: null, color: botC },
              { label: delta >= 0 ? "AHEAD" : "BEHIND", val: `${delta >= 0 ? "+" : "−"}$${Math.abs(delta).toFixed(2)}`, color: delta >= 0 ? sage : red },
            ].map((item, i) => (
              <div key={item.label} style={{ textAlign: "right", padding: "0 22px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontFamily: "var(--mono)", fontSize: 7.5, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-4)", margin: "0 0 2px" }}>{item.label}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, margin: 0, color: item.color }}>
                  {i === 1 ? <Counter value={game.balance} /> : i === 2 ? <Counter value={game.botBalance} /> : item.val}
                </p>
              </div>
            ))}

            <div style={{ paddingLeft: 22, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={reset} style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--text-4)", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "5px 14px", cursor: "pointer" }}>
                RESET
              </button>
            </div>
          </div>

          {/* Dual progress bars */}
          <div style={{ position: "relative", height: 2 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${botPct}%`, background: botC, opacity: 0.35, transition: "width 0.9s ease" }} />
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${sage}cc, ${sage})`, transition: "width 0.9s ease" }} />
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", padding: "36px 32px 100px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Sparkline */}
          {game.history.length >= 1 && (
            <div style={{ padding: "16px 24px", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--text-4)" }}>EQUITY CURVE</span>
                <div style={{ display: "flex", gap: 18, fontFamily: "var(--mono)", fontSize: 8, color: "var(--text-4)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 2, background: sage, display: "inline-block" }} />YOU</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 1, borderTop: `1px dashed ${botC}`, display: "inline-block", opacity: 0.7 }} />KELLY BOT</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 1, background: gold, display: "inline-block", opacity: 0.4 }} />$1K TARGET</span>
                </div>
              </div>
              <div style={{ height: 56 }}><Sparkline history={game.history} /></div>
            </div>
          )}

          {game.phase === "allocate" && <AllocationPhase game={game} onSimulate={handleSimulate} />}
          {game.phase === "results" && lastRound && <ResultsPhase round={lastRound} game={game} won={won} broke={broke} onContinue={handleContinue} />}
        </div>
      </div>
    </div>
  );
}
