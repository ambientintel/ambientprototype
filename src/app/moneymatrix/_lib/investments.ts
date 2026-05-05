import { Investment, InvestmentType } from "./types";

export const INVESTMENTS: Record<InvestmentType, Investment> = {
  savings: {
    type: "savings",
    label: "High-Yield Savings",
    emoji: "🏦",
    description: "Safe but slow. 2–5% APY. Never loses value.",
    minReturn: 0.5,
    maxReturn: 1.5,
    risk: "low",
    minCapital: 1,
  },
  stocks: {
    type: "stocks",
    label: "Stock Market",
    emoji: "📈",
    description: "Index funds & blue chips. Steady growth with occasional dips.",
    minReturn: -15,
    maxReturn: 30,
    risk: "medium",
    minCapital: 5,
  },
  realestate: {
    type: "realestate",
    label: "Real Estate",
    emoji: "🏠",
    description: "REITs & crowdfunded property. Slow but reliable.",
    minReturn: 3,
    maxReturn: 20,
    risk: "low",
    minCapital: 20,
  },
  sidehustle: {
    type: "sidehustle",
    label: "Side Hustle",
    emoji: "💼",
    description: "Flip items, freelance, sell online. Grind for guaranteed gains.",
    minReturn: 10,
    maxReturn: 60,
    risk: "medium",
    minCapital: 5,
  },
  crypto: {
    type: "crypto",
    label: "Crypto",
    emoji: "₿",
    description: "High risk, high reward. Could moon or crater overnight.",
    minReturn: -60,
    maxReturn: 150,
    risk: "extreme",
    minCapital: 1,
  },
};

export const INVESTMENT_LIST = Object.values(INVESTMENTS);
