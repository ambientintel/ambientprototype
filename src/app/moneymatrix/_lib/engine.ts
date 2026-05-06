import { Allocation, GameRound, MarketEvent, RoundResult } from "./types";
import { INVESTMENTS } from "./investments";

const MARKET_EVENTS: MarketEvent[] = [
  {
    name: "Bull Run",
    description: "Markets are surging! Stocks and crypto going parabolic.",
    emoji: "🐂",
    multiplier: 1.5,
    affects: ["stocks", "crypto"],
  },
  {
    name: "Market Crash",
    description: "Red day across the board. Portfolios taking heavy losses.",
    emoji: "📉",
    multiplier: 0.5,
    affects: ["stocks", "crypto"],
  },
  {
    name: "Crypto Winter",
    description: "Crypto is in freefall. HODLers are suffering.",
    emoji: "🥶",
    multiplier: 0.3,
    affects: ["crypto"],
  },
  {
    name: "Crypto Mania",
    description: "Everyone's talking about coins. Massive gains incoming.",
    emoji: "🚀",
    multiplier: 2.0,
    affects: ["crypto"],
  },
  {
    name: "Housing Boom",
    description: "Real estate prices skyrocketing. REITs paying out big.",
    emoji: "🏗️",
    multiplier: 1.8,
    affects: ["realestate"],
  },
  {
    name: "Gig Economy Surge",
    description: "Side hustles are in demand! Your grind is paying off double.",
    emoji: "⚡",
    multiplier: 1.6,
    affects: ["sidehustle"],
  },
  {
    name: "Interest Rate Hike",
    description: "Fed raises rates. Savings accounts winning today.",
    emoji: "🏦",
    multiplier: 2.5,
    affects: ["savings"],
  },
  {
    name: "Calm Market",
    description: "Nothing major happening. Steady as she goes.",
    emoji: "😌",
    multiplier: 1.0,
    affects: [],
  },
];

function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickEvent(round: number): MarketEvent | undefined {
  const eventChance = Math.min(0.3 + round * 0.05, 0.7);
  if (Math.random() > eventChance) return undefined;
  return MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
}

export function simulateRound(
  round: number,
  startBalance: number,
  allocations: Allocation[]
): GameRound {
  const event = pickEvent(round);
  const results: RoundResult[] = [];
  let totalEnd = startBalance;

  for (const alloc of allocations) {
    if (alloc.amount <= 0) continue;
    const inv = INVESTMENTS[alloc.type];
    let returnPct = randBetween(inv.minReturn, inv.maxReturn);

    if (event && event.affects.includes(alloc.type)) {
      if (returnPct < 0) {
        returnPct *= event.multiplier > 1 ? 1 / event.multiplier : event.multiplier;
      } else {
        returnPct *= event.multiplier;
      }
    }

    const profit = (alloc.amount * returnPct) / 100;
    totalEnd += profit;

    results.push({
      type: alloc.type,
      label: inv.label,
      emoji: inv.emoji,
      amountInvested: alloc.amount,
      returnPct: Math.round(returnPct * 10) / 10,
      profit: Math.round(profit * 100) / 100,
      event: event && event.affects.includes(alloc.type) ? event.name : undefined,
    });
  }

  return {
    round,
    startBalance,
    allocations,
    results,
    endBalance: Math.max(0, Math.round(totalEnd * 100) / 100),
    marketEvent: event,
  };
}
