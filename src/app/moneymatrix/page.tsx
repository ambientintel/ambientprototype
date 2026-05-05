"use client";
import { useState, useId } from "react";
import { GameState, Allocation, GameRound, InvestmentType } from "./_lib/types";
import { simulateRound } from "./_lib/engine";
import { INVESTMENT_LIST } from "./_lib/investments";
import "./moneymatrix.css";

const START = 20;
const TARGET = 1000;
const sage = "#3DCC91";
const gold = "#eab308";
const red = "#ef4444";
const RISK_COLOR: Record<string, string> = { low: sage, medium: gold, high: "#f97316", extreme: red };

// ── Financial network motion graphic ─────────────────────────────────────────
function FinancialNetworkSVG() {
  return (
    <svg style={{ position: "absolute", width: "100%", height: "100%" }}
      viewBox="0 0 1440 500" preserveAspectRatio="xMidYMid slice">
      <style>{`
        .fb { stroke: rgba(61,204,145,1); stroke-width: 0.6; fill: none; opacity: 0.06; }
        .fl { stroke: rgba(61,204,145,1); stroke-width: 1.2; fill: none; stroke-dasharray: 20 600; }
        .fl1  { animation: fp  8.0s linear infinite;                         opacity: 0.30; }
        .fl2  { animation: fp 10.5s linear infinite; animation-delay:-4.3s;  opacity: 0.24; }
        .fl3  { animation: fp  7.2s linear infinite; animation-delay:-1.8s;  opacity: 0.32; }
        .fl4  { animation: fp  9.8s linear infinite; animation-delay:-6.0s;  opacity: 0.22; }
        .fl5  { animation: fp  9.0s linear infinite; animation-delay:-3.1s;  opacity: 0.28; }
        .fl6  { animation: fp  7.8s linear infinite; animation-delay:-0.9s;  opacity: 0.26; }
        .fl7  { animation: fp 10.2s linear infinite; animation-delay:-5.5s;  opacity: 0.24; }
        .fl8  { animation: fp  8.4s linear infinite; animation-delay:-2.2s;  opacity: 0.26; }
        .fl9  { animation: fp  9.3s linear infinite; animation-delay:-7.2s;  opacity: 0.22; }
        .fl10 { animation: fp  7.5s linear infinite; animation-delay:-3.7s;  opacity: 0.28; }
        @keyframes fp { from { stroke-dashoffset: 620; } to { stroke-dashoffset: 0; } }
        .fn   { fill: rgba(61,204,145,1); opacity: 0.18; }
        .fn-g { fill: rgba(234,179,8,1);  opacity: 0.22; }
      `}</style>
      <line x1="160" y1="300" x2="560" y2="200" className="fb" />
      <line x1="160" y1="300" x2="420" y2="400" className="fb" />
      <line x1="560" y1="200" x2="440" y2="90"  className="fb" />
      <line x1="560" y1="200" x2="760" y2="300" className="fb" />
      <line x1="440" y1="90"  x2="760" y2="300" className="fb" />
      <line x1="440" y1="90"  x2="920" y2="120" className="fb" />
      <line x1="760" y1="300" x2="920" y2="120" className="fb" />
      <line x1="760" y1="300" x2="1100" y2="380" className="fb" />
      <line x1="920" y1="120" x2="1220" y2="180" className="fb" />
      <line x1="1100" y1="380" x2="1220" y2="180" className="fb" />
      <line x1="1220" y1="180" x2="1370" y2="300" className="fb" />
      <line x1="160" y1="300" x2="560" y2="200" className="fl fl1" />
      <line x1="160" y1="300" x2="420" y2="400" className="fl fl2" />
      <line x1="560" y1="200" x2="440" y2="90"  className="fl fl3" />
      <line x1="560" y1="200" x2="760" y2="300" className="fl fl4" />
      <line x1="440" y1="90"  x2="760" y2="300" className="fl fl5" />
      <line x1="440" y1="90"  x2="920" y2="120" className="fl fl6" />
      <line x1="760" y1="300" x2="920" y2="120" className="fl fl7" />
      <line x1="760" y1="300" x2="1100" y2="380" className="fl fl8" />
      <line x1="920" y1="120" x2="1220" y2="180" className="fl fl9" />
      <line x1="1220" y1="180" x2="1370" y2="300" className="fl fl10" />
      <circle cx="160"  cy="300" r="3"   className="fn"   />
      <circle cx="420"  cy="400" r="2.5" className="fn"   />
      <circle cx="440"  cy="90"  r="2.5" className="fn-g" />
      <circle cx="560"  cy="200" r="4"   className="fn"   />
      <circle cx="760"  cy="300" r="3.5" className="fn"   />
      <circle cx="920"  cy="120" r="3"   className="fn-g" />
      <circle cx="1100" cy="380" r="2.5" className="fn"   />
      <circle cx="1220" cy="180" r="4"   className="fn-g" />
      <circle cx="1370" cy="300" r="2.5" className="fn"   />
    </svg>
  );
}

// ── Portfolio sparkline ───────────────────────────────────────────────────────
function PortfolioLine({ history }: { history: GameRound[] }) {
  const id = useId();
  const gid = `mm-g-${id}`;
  if (history.length < 2) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
      Play a round to see history
    </div>
  );
  const pts = [START, ...history.map(r => r.endBalance)];
  const max = Math.max(TARGET, ...pts) * 1.08;
  const w = 400; const h = 90; const p = 6;
  const coords = pts.map((v, i) => [p + (i / (pts.length - 1)) * (w - p * 2), h - p - (v / max) * (h - p * 2)]);
  const pathD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const tY = h - p - (TARGET / max) * (h - p * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sage} stopOpacity="0.28" />
          <stop offset="100%" stopColor={sage} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={p} y1={tY} x2={w - p} y2={tY} stroke={gold} strokeWidth="1" strokeDasharray="4,3" opacity="0.55" />
      <path d={`${pathD} L${coords[coords.length-1][0]},${h-p} L${coords[0][0]},${h-p} Z`} fill={`url(#${gid})`} />
      <path d={pathD} fill="none" stroke={sage} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={sage} />)}
    </svg>
  );
}

// ── Allocation interface ──────────────────────────────────────────────────────
function AllocationInterface({ balance, onInvest }: { balance: number; onInvest: (a: Allocation[]) => void }) {
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
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p className="crumb" style={{ margin: "0 0 4px" }}>Allocation</p>
          <h2 className="section-title" style={{ fontSize: 24, margin: 0 }}>Where does your money go?</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Unallocated</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600, margin: 0, color: over ? red : remaining > 0 ? "var(--text)" : sage }}>${remaining.toFixed(2)}</p>
          {over && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: red, margin: "2px 0 0" }}>Over budget</p>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {INVESTMENT_LIST.map(inv => {
          const disabled = balance < inv.minCapital;
          const val = amounts[inv.type];
          const hasAmt = (parseFloat(val) || 0) > 0;
          return (
            <div key={inv.type} style={{ padding: "20px", background: hasAmt ? "var(--surface-2)" : "var(--surface-1)", border: `1px solid ${hasAmt ? "var(--line-strong)" : "var(--line)"}`, borderRadius: 12, opacity: disabled ? 0.38 : 1, display: "flex", flexDirection: "column", gap: 12, transition: "all 0.15s ease" }}>
              <div>
                <p style={{ fontSize: 26, margin: "0 0 8px" }}>{inv.emoji}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", color: RISK_COLOR[inv.risk], margin: "0 0 4px" }}>Risk: {inv.risk}</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, margin: "0 0 4px" }}>{inv.label}</p>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5, margin: "0 0 8px" }}>{inv.description}</p>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-4)" }}>
                  <span style={{ color: inv.minReturn < 0 ? red : sage }}>{inv.minReturn > 0 ? "+" : ""}{inv.minReturn}%</span>
                  <span style={{ margin: "0 4px" }}>–</span>
                  <span style={{ color: sage }}>+{inv.maxReturn}%</span>
                </div>
              </div>
              {!disabled ? (
                <div>
                  <div style={{ position: "relative", marginBottom: 6 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-3)" }}>$</span>
                    <input type="number" min="0" max={balance} step="0.01" placeholder="0.00" value={val}
                      onChange={e => setAmounts(p => ({ ...p, [inv.type]: e.target.value }))}
                      style={{ width: "100%", background: "var(--surface-3)", color: "var(--text)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "8px 10px 8px 24px", fontFamily: "var(--mono)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <button onClick={() => setMax(inv.type)} style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: sage, background: "none", border: "none", cursor: "pointer", padding: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>Max →</button>
                </div>
              ) : (
                <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Min ${inv.minCapital}</p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 32 }}>
          {[{ label: "Allocated", val: `$${total.toFixed(2)}`, color: "var(--text)" }, { label: "Available", val: `$${balance.toFixed(2)}`, color: sage }].map(m => (
            <div key={m.label}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>{m.label}</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, margin: 0, color: m.color }}>{m.val}</p>
            </div>
          ))}
        </div>
        <button onClick={submit} disabled={total <= 0 || over} className="btn btn-light"
          style={{ padding: "12px 32px", fontSize: 14, borderRadius: 999, opacity: total <= 0 || over ? 0.4 : 1, cursor: total <= 0 || over ? "not-allowed" : "pointer" }}>
          Invest →
        </button>
      </div>
    </div>
  );
}

// ── Results report ────────────────────────────────────────────────────────────
function ResultsReport({ round, onContinue, isWinner, isBroke }: { round: GameRound; onContinue: () => void; isWinner: boolean; isBroke: boolean }) {
  const totalProfit = round.results.reduce((s, r) => s + r.profit, 0);
  const pos = totalProfit >= 0;
  return (
    <div>
      {round.marketEvent && (
        <div style={{ padding: "16px 24px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{round.marketEvent.emoji}</span>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: gold, margin: "0 0 2px" }}>Market Event</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>{round.marketEvent.name}</p>
            <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>{round.marketEvent.description}</p>
          </div>
        </div>
      )}

      {isWinner && (
        <div style={{ padding: "24px", background: "rgba(61,204,145,0.07)", border: "1px solid rgba(61,204,145,0.35)", borderRadius: 12, marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 36, margin: "0 0 8px" }}>🎉</p>
          <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.02em", color: sage, margin: "0 0 6px" }}>You hit <em>$1,000</em></p>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>You turned $20 into a thousand. The market bowed.</p>
        </div>
      )}
      {isBroke && !isWinner && (
        <div style={{ padding: "24px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, marginBottom: 20, textAlign: "center" }}>
          <p style={{ fontSize: 36, margin: "0 0 8px" }}>💀</p>
          <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.02em", color: red, margin: "0 0 6px" }}>Portfolio <em>wiped out</em></p>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>The market is merciless. Diversify next time.</p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p className="crumb" style={{ margin: "0 0 4px" }}>Round {round.round} — Results</p>
          <h2 className="section-title" style={{ fontSize: 24, margin: 0 }}>Position <em>Breakdown</em></h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Round P&L</p>
          <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 32, letterSpacing: "-0.03em", margin: 0, lineHeight: 1, color: pos ? sage : red }}>
            {pos ? "+" : ""}${totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="chart-card" style={{ margin: "0 0 20px", padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 96px 96px 96px 120px", gap: 16, padding: "12px 24px", borderBottom: "1px solid var(--line)", fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-4)" }}>
          <span>Position</span><span style={{ textAlign: "right" }}>Invested</span><span style={{ textAlign: "right" }}>Return</span><span style={{ textAlign: "right" }}>P&L</span><span style={{ textAlign: "right" }}>Event</span>
        </div>
        {round.results.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 96px 96px 96px 120px", gap: 16, padding: "14px 24px", borderBottom: i < round.results.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>{r.label}</p>
                <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{r.type}</p>
              </div>
            </div>
            <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, margin: 0, color: "var(--text-2)" }}>${r.amountInvested.toFixed(2)}</p>
            <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, margin: 0, color: r.returnPct >= 0 ? sage : red }}>{r.returnPct >= 0 ? "+" : ""}{r.returnPct}%</p>
            <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, margin: 0, color: r.profit >= 0 ? sage : red }}>{r.profit >= 0 ? "+" : ""}${r.profit.toFixed(2)}</p>
            <p style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 10.5, color: gold, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.event ?? "—"}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>New Balance</p>
          <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 28, letterSpacing: "-0.02em", margin: 0 }}>${round.endBalance.toFixed(2)}</p>
        </div>
        <button onClick={onContinue} className="btn btn-light" style={{ padding: "12px 32px", fontSize: 14, borderRadius: 999 }}>
          {isWinner || isBroke ? "Play Again →" : "Next Round →"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function initGame(): GameState {
  return { phase: "intro", balance: START, round: 1, history: [], startingBalance: START, targetBalance: TARGET };
}

export default function MoneyMatrixPage() {
  const [game, setGame] = useState<GameState>(initGame());
  const [lastRound, setLastRound] = useState<GameRound | null>(null);
  const [isWinner, setWinner] = useState(false);
  const [isBroke, setBroke] = useState(false);

  function startGame() {
    setGame({ ...initGame(), phase: "allocate" });
    setLastRound(null); setWinner(false); setBroke(false);
  }
  function handleInvest(allocations: Allocation[]) {
    const result = simulateRound(game.round, game.balance, allocations);
    const won = result.endBalance >= TARGET;
    const broke = result.endBalance <= 0;
    setLastRound(result); setWinner(won); setBroke(broke);
    setGame(prev => ({ ...prev, phase: "results", balance: result.endBalance, history: [...prev.history, result] }));
  }
  function handleContinue() {
    if (isWinner || isBroke) { startGame(); return; }
    setGame(prev => ({ ...prev, phase: "allocate", round: prev.round + 1 }));
  }

  const pct = Math.min((game.balance / TARGET) * 100, 100);

  // ── Shared nav ──────────────────────────────────────────────────────────────
  const Nav = (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid var(--line)", background: "rgba(28,33,39,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", padding: "0 44px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 400, letterSpacing: "-0.01em" }}>
          Money<em className="mm-shimmer-em">Matrix</em>
        </span>
        {game.phase === "intro" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[{ id: "how", label: "How to Play" }, { id: "assets", label: "Assets" }, { id: "start", label: "Play Now" }].map(s => (
              <a key={s.id} href={`#${s.id}`} className="invest-nav-link">{s.label}</a>
            ))}
            <button onClick={startGame} className="btn btn-light" style={{ padding: "7px 18px", fontSize: 12.5 }}>Start Playing →</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Round {game.round}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: sage }}>${game.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <button onClick={startGame} className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>Restart</button>
          </div>
        )}
      </div>
    </nav>
  );

  // ── Intro / landing ─────────────────────────────────────────────────────────
  if (game.phase === "intro") {
    return (
      <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh" }}>
        {Nav}

        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--line)", padding: "80px 44px 72px" }}>
          <div style={{ pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(246,247,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(246,247,248,1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div style={{ pointerEvents: "none", position: "absolute", inset: 0, overflow: "hidden" }}>
            <div className="animate-hero-orb-1" style={{ position: "absolute", left: "-8%", top: "-40%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(61,204,145,0.20) 0%, transparent 65%)", filter: "blur(90px)" }} />
            <div className="animate-hero-orb-2" style={{ position: "absolute", bottom: "-30%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 65%)", filter: "blur(90px)" }} />
            <div className="animate-hero-orb-3" style={{ position: "absolute", right: 0, top: "20%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,114,210,0.10) 0%, transparent 65%)", filter: "blur(90px)" }} />
            <FinancialNetworkSVG />
          </div>
          <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(61,204,145,0.25)", background: "rgba(61,204,145,0.06)", marginBottom: 32 }}>
              <span className="mm-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: sage, display: "inline-block" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.14em" }}>Investing Simulation · $20 → $1,000</span>
            </div>

            <div style={{ marginBottom: 8 }}>
              <span className="mm-shimmer-text" style={{ fontSize: "clamp(56px, 8vw, 108px)", fontWeight: 800, display: "block", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
                MoneyMatrix
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: "clamp(22px, 3vw, 36px)", letterSpacing: "-0.015em", color: "var(--text-2)", margin: "0 0 24px", lineHeight: 1.2 }}>
              Turn twenty dollars <em>into one thousand</em>
            </h2>
            <p style={{ maxWidth: 520, fontSize: 16, lineHeight: 1.7, color: "var(--text-3)", marginBottom: 40 }}>
              A round-based investing game. Allocate capital across five asset classes,
              survive random market events, and compound your way to $1,000.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 56 }}>
              <button onClick={startGame} className="btn btn-light" style={{ padding: "11px 28px", fontSize: 14, borderRadius: 999 }}>Start with $20 →</button>
              <a href="#how" className="btn btn-ghost" style={{ padding: "11px 22px", fontSize: 13.5, borderRadius: 999 }}>How It Works</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, maxWidth: 800 }}>
              {[
                { value: "$20", label: "Starting Capital", sub: "Your seed investment" },
                { value: "$1K", label: "Win Condition",   sub: "Target portfolio value" },
                { value: "5",   label: "Asset Classes",   sub: "Stocks · Crypto · More" },
                { value: "8",   label: "Market Events",   sub: "Bull runs to crashes" },
              ].map(s => (
                <div key={s.value} style={{ padding: "18px 20px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 36, letterSpacing: "-0.03em", margin: "0 0 4px", lineHeight: 1, color: sage }}>{s.value}</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-2)", margin: "0 0 3px" }}>{s.label}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text-3)", margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-1)", padding: "72px 44px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <p className="crumb" style={{ marginBottom: 12 }}>The Mechanics</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
              <div>
                <h2 className="section-title" style={{ fontSize: 32, marginBottom: 16 }}>Round by round,<br /><em>your decisions compound</em></h2>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", marginBottom: 24 }}>
                  Each round you allocate your full portfolio across up to five investment types.
                  Markets simulate realistic return distributions — with occasional dramatic events
                  that can supercharge gains or wipe out positions overnight.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Diversify to survive — never put everything in crypto",
                    "Market events are random but scale in frequency over rounds",
                    "Real estate unlocks once your portfolio hits $20",
                    "Hit $0 and the game ends — risk management matters",
                    "Reach $1,000 to win and see how fast you can get there",
                  ].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-2)" }}>
                      <span style={{ color: sage, marginTop: 2, flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { n: 1, icon: "◉", color: sage,         title: "Allocate Capital",     body: "Each round, split your portfolio across savings, stocks, real estate, side hustles, and crypto in any combination." },
                  { n: 2, icon: "◈", color: gold,         title: "Market Simulation",    body: "Returns are drawn from realistic distributions. A random event may amplify or crush one or more of your positions." },
                  { n: 3, icon: "◆", color: "#2D72D2",    title: "Track Your Growth",    body: "Watch your portfolio curve compound round by round. The sparkline updates in real time. Hit $1,000 to win." },
                ].map(s => (
                  <div key={s.n} style={{ display: "flex", gap: 14, padding: "20px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12 }}>
                    <span style={{ fontSize: 18, color: s.color, flexShrink: 0, marginTop: 2 }}>{s.icon}</span>
                    <div>
                      <p style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-3)", margin: "0 0 5px" }}>Step {s.n}</p>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 5px" }}>{s.title}</p>
                      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ASSET CLASSES */}
        <section id="assets" style={{ borderBottom: "1px solid var(--line)", padding: "72px 44px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <p className="crumb" style={{ marginBottom: 12 }}>Your Instruments</p>
            <h2 className="section-title" style={{ fontSize: 32, marginBottom: 8 }}>Five Ways <em>to Grow</em></h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 40, maxWidth: 540, lineHeight: 1.7 }}>
              Each asset class has a distinct risk/reward profile. Mix them strategically — or gamble it all on crypto.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
              {INVESTMENT_LIST.map(inv => (
                <div key={inv.type} style={{ padding: "24px 20px", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <p style={{ fontSize: 30, margin: "0 0 14px" }}>{inv.emoji}</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", color: RISK_COLOR[inv.risk], margin: "0 0 6px" }}>Risk: {inv.risk}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{inv.label}</p>
                  <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.55, margin: "0 0 16px" }}>{inv.description}</p>
                  <div style={{ padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 11 }}>
                    <span style={{ color: inv.minReturn < 0 ? red : sage }}>{inv.minReturn > 0 ? "+" : ""}{inv.minReturn}%</span>
                    <span style={{ color: "var(--text-4)", margin: "0 6px" }}>to</span>
                    <span style={{ color: sage }}>+{inv.maxReturn}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* START CTA */}
        <section id="start" style={{ padding: "80px 44px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${sage}`, background: "rgba(61,204,145,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="5" fill={sage} opacity="0.9" />
                <circle cx="14" cy="14" r="10" stroke={sage} strokeWidth="1.5" opacity="0.5" />
                <circle cx="14" cy="14" r="13" stroke={sage} strokeWidth="1" opacity="0.25" />
              </svg>
            </div>
            <h2 className="section-title" style={{ fontSize: 36, marginBottom: 16 }}>Ready to <em>Build Wealth?</em></h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 32 }}>
              You have $20. The market is open. Every decision matters.
            </p>
            <button onClick={startGame} className="btn btn-light" style={{ padding: "14px 40px", fontSize: 15, borderRadius: 999 }}>Start with $20 →</button>
          </div>
        </section>

        <footer style={{ borderTop: "1px solid var(--line)", padding: "24px 44px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: 14 }}>Money<em className="mm-shimmer-em">Matrix</em></span>
            <p className="agent-note" style={{ margin: 0 }}>Simulated investing · Not financial advice · All returns are fictional</p>
            <a href="/invest" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.1em" }}>← Invest Page</a>
          </div>
        </footer>
      </div>
    );
  }

  // ── Game dashboard ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh" }}>
      {Nav}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 44px 80px" }}>

        {/* Balance card */}
        <div className="chart-card" style={{ margin: "0 0 28px", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p className="crumb" style={{ margin: "0 0 6px" }}>Portfolio Value</p>
              <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 56, letterSpacing: "-0.03em", margin: 0, lineHeight: 1, color: sage }}>
                ${game.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="crumb" style={{ margin: "0 0 4px" }}>Round</p>
              <p style={{ fontFamily: "var(--serif)", fontWeight: 300, fontSize: 40, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>{game.round}</p>
            </div>
          </div>
          <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${sage}, ${gold})`, borderRadius: 3, transition: "width 0.7s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: game.history.length >= 2 ? 20 : 0 }}>
            <span>$20 start</span>
            <span style={{ color: sage }}>{pct.toFixed(1)}% of goal</span>
            <span style={{ color: gold }}>$1,000 target</span>
          </div>

          {game.history.length >= 2 && (
            <div style={{ paddingTop: 20, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p className="chart-title" style={{ fontSize: 14, margin: 0 }}>Portfolio <em>History</em></p>
                <div style={{ display: "flex", gap: 16, fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 2, background: sage, borderRadius: 2, display: "inline-block" }} /> Portfolio</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 2, background: gold, borderRadius: 2, display: "inline-block", opacity: 0.6 }} /> Target</span>
                </div>
              </div>
              <div style={{ height: 90 }}><PortfolioLine history={game.history} /></div>
            </div>
          )}
        </div>

        {game.phase === "allocate" && <AllocationInterface balance={game.balance} onInvest={handleInvest} />}
        {game.phase === "results" && lastRound && <ResultsReport round={lastRound} onContinue={handleContinue} isWinner={isWinner} isBroke={isBroke} />}
      </div>
    </div>
  );
}
