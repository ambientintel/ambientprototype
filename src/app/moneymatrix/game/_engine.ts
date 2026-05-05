import { MarketRegime, StrategyCategory, Strategy, StrategyCard, Allocation, PositionResult, RoundResult } from "./_types";
import { STRATEGIES } from "./_strategies";

// ── Markov regime transitions ─────────────────────────────────────────────────
const TRANSITIONS: Record<MarketRegime, [MarketRegime, number][]> = {
  bull:         [["bull", 0.50], ["euphoria", 0.15], ["sideways", 0.25], ["high_vol", 0.10]],
  bear:         [["bear", 0.45], ["capitulation", 0.20], ["sideways", 0.25], ["high_vol", 0.10]],
  sideways:     [["sideways", 0.40], ["bull", 0.25], ["bear", 0.20], ["high_vol", 0.15]],
  high_vol:     [["high_vol", 0.30], ["bull", 0.20], ["bear", 0.20], ["sideways", 0.20], ["euphoria", 0.05], ["capitulation", 0.05]],
  euphoria:     [["euphoria", 0.30], ["bull", 0.35], ["high_vol", 0.20], ["bear", 0.10], ["capitulation", 0.05]],
  capitulation: [["capitulation", 0.25], ["bear", 0.30], ["sideways", 0.25], ["high_vol", 0.15], ["bull", 0.05]],
};

export function nextRegime(current: MarketRegime): MarketRegime {
  const options = TRANSITIONS[current];
  let r = Math.random();
  for (const [regime, prob] of options) {
    r -= prob;
    if (r <= 0) return regime;
  }
  return options[options.length - 1][0];
}

export function randomStartRegime(): MarketRegime {
  const regimes: MarketRegime[] = ["bull", "bear", "sideways", "high_vol", "euphoria", "capitulation"];
  const weights =                  [0.35,   0.20,   0.25,       0.10,       0.05,       0.05      ];
  let r = Math.random();
  for (let i = 0; i < regimes.length; i++) {
    r -= weights[i];
    if (r <= 0) return regimes[i];
  }
  return "bull";
}

// ── Category weights by regime ────────────────────────────────────────────────
const REGIME_WEIGHTS: Record<MarketRegime, Record<StrategyCategory, number>> = {
  bull:         { equity: 3.0, crypto: 2.0, quant: 1.0, macro: 0.5, prediction: 1.0 },
  bear:         { macro: 3.0, quant: 2.0, equity: 0.5, crypto: 0.5, prediction: 1.0 },
  sideways:     { quant: 3.0, macro: 2.0, equity: 1.0, crypto: 1.0, prediction: 1.0 },
  high_vol:     { prediction: 2.5, quant: 2.0, macro: 1.5, crypto: 1.0, equity: 0.5 },
  euphoria:     { crypto: 3.0, equity: 2.0, prediction: 1.5, quant: 0.5, macro: 0.5 },
  capitulation: { macro: 3.0, quant: 2.0, prediction: 2.0, equity: 0.5, crypto: 0.5 },
};

// Regime confidence bonuses per category (percentage points)
const CONFIDENCE_BONUS: Record<MarketRegime, Partial<Record<StrategyCategory, number>>> = {
  bull:         { equity: 14, crypto: 9 },
  bear:         { macro: 14, quant: 9 },
  sideways:     { quant: 12, macro: 7 },
  high_vol:     { prediction: 12, quant: 8 },
  euphoria:     { crypto: 18, equity: 13 },
  capitulation: { macro: 14, quant: 11 },
};

// Regime return bias per category (percentage points added to simulated return)
const RETURN_BIAS: Record<MarketRegime, Partial<Record<StrategyCategory, number>>> = {
  bull:         { equity: 10, crypto: 15, macro: -5, prediction: 5 },
  bear:         { macro: 15, quant: 5, equity: -15, crypto: -20, prediction: -5 },
  sideways:     { quant: 5, macro: 5 },
  high_vol:     { prediction: 8, quant: -5 },
  euphoria:     { crypto: 25, equity: 15, quant: -5, macro: -10 },
  capitulation: { macro: 10, quant: 5, crypto: -25, equity: -20, prediction: -10 },
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Weighted sample without replacement
function weightedSampleN(strategies: Strategy[], weights: Record<StrategyCategory, number>, n: number): Strategy[] {
  const pool = strategies.map(s => ({ strategy: s, weight: weights[s.category] ?? 1 }));
  const selected: Strategy[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const total = pool.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    let idx = pool.length - 1;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight;
      if (r <= 0) { idx = j; break; }
    }
    selected.push(pool[idx].strategy);
    pool.splice(idx, 1);
  }
  return selected;
}

export function generateCards(regime: MarketRegime, count = 6): StrategyCard[] {
  const weights = REGIME_WEIGHTS[regime];
  const bonuses = CONFIDENCE_BONUS[regime];
  const selected = weightedSampleN(STRATEGIES, weights, count);

  const cards: StrategyCard[] = selected.map(s => {
    const base = rand(40, 73);
    const bonus = bonuses[s.category] ?? 0;
    const confidence = Math.min(97, Math.max(32, Math.round(base + bonus + rand(-4, 4))));
    const thesis = s.theses[Math.floor(Math.random() * s.theses.length)];
    return { ...s, confidence, thesis, isRecommended: false };
  });

  // Sort descending, mark top confidence as recommended
  cards.sort((a, b) => b.confidence - a.confidence);
  cards[0].isRecommended = true;

  return cards;
}

function simulatePosition(card: StrategyCard, amount: number, regime: MarketRegime): PositionResult {
  const regimeBias = RETURN_BIAS[regime]?.[card.category] ?? 0;
  const confidenceFactor = (card.confidence - 50) / 50; // –1 to +1

  let returnPct: number;
  let wasWin: boolean | undefined;

  if (card.isBinary) {
    const baseProb = card.baseWinProb ?? 0.5;
    const effectiveProb = Math.min(0.93, Math.max(0.07,
      baseProb + confidenceFactor * 0.08 + regimeBias * 0.003,
    ));
    wasWin = Math.random() < effectiveProb;
    returnPct = wasWin ? ((card.payoutMultiplier ?? 1.9) - 1) * 100 : -100;
  } else {
    const lo = card.minReturn ?? -50;
    const hi = card.maxReturn ?? 50;
    const mid = (lo + hi) / 2;
    const half = (hi - lo) / 2;
    const bias = confidenceFactor * half * 0.38 + regimeBias;
    const noise = rand(-half * 0.55, half * 0.55);
    returnPct = Math.max(lo * 1.4, Math.min(hi * 1.4, mid + bias + noise));
  }

  const profit = amount * returnPct / 100;
  const aiWasRight = card.isBinary ? wasWin === true : returnPct > 0;

  return {
    strategyId: card.id,
    name: card.name,
    emoji: card.emoji,
    category: card.category,
    amountInvested: amount,
    confidence: card.confidence,
    isBinary: card.isBinary ?? false,
    wasWin,
    returnPct,
    profit,
    aiWasRight,
  };
}

export function simulateRound(
  round: number,
  regime: MarketRegime,
  startBalance: number,
  cards: StrategyCard[],
  allocations: Allocation[],
): RoundResult {
  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]));
  const positions: PositionResult[] = [];

  for (const alloc of allocations) {
    const card = cardMap[alloc.strategyId];
    if (!card || alloc.amount <= 0) continue;
    positions.push(simulatePosition(card, alloc.amount, regime));
  }

  const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);

  return {
    round,
    regime,
    startBalance,
    cards,
    allocations,
    positions,
    endBalance: startBalance + totalProfit,
    totalProfit,
  };
}

// ── Display metadata ──────────────────────────────────────────────────────────
export const REGIME_LABEL: Record<MarketRegime, string> = {
  bull:         "Bull Market",
  bear:         "Bear Market",
  sideways:     "Sideways / Consolidation",
  high_vol:     "High Volatility",
  euphoria:     "Market Euphoria",
  capitulation: "Capitulation",
};

export const REGIME_COLOR: Record<MarketRegime, string> = {
  bull:         "#3DCC91",
  bear:         "#FF5A5A",
  sideways:     "#A0A8B8",
  high_vol:     "#FFB347",
  euphoria:     "#C77DFF",
  capitulation: "#FF6B6B",
};

export const REGIME_DESCRIPTION: Record<MarketRegime, string> = {
  bull:         "Risk-on. Equity momentum and crypto alpha are firing. Quant models see continued upside.",
  bear:         "Risk-off. Macro hedges and market-neutral quant are outperforming. Cut exposure.",
  sideways:     "Chop. Mean reversion and stat arb excel. Directional bets are punished.",
  high_vol:     "Chaos. Prediction markets and vol strategies shine. Size down on everything else.",
  euphoria:     "Melt-up. Crypto and leveraged equity capturing explosive moves. Blow-off top risk elevated.",
  capitulation: "Flush. Blood in the streets. Macro hedges protecting capital. Contrarian entries forming.",
};

export const CATEGORY_LABEL: Record<StrategyCategory, string> = {
  prediction: "Prediction Market",
  crypto:     "Crypto Alpha",
  equity:     "Equity",
  quant:      "Quant / Algo",
  macro:      "Macro",
};

export const RISK_COLOR: Record<string, string> = {
  very_low: "#4CAF50",
  low:      "#8BC34A",
  medium:   "#FFB300",
  high:     "#FF7043",
  extreme:  "#F44336",
};

export const RISK_LABEL: Record<string, string> = {
  very_low: "Very Low",
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  extreme:  "Extreme",
};

export const STARTING_BALANCE = 20;
export const TARGET_BALANCE   = 1000;
