export type MarketRegime = "bull" | "bear" | "sideways" | "high_vol" | "euphoria" | "capitulation";
export type StrategyCategory = "prediction" | "crypto" | "equity" | "quant" | "macro";
export type RiskTier = "very_low" | "low" | "medium" | "high" | "extreme";

export interface Strategy {
  id: string;
  name: string;
  emoji: string;
  category: StrategyCategory;
  theses: string[];           // multiple theses, one picked per round
  tags: string[];
  riskTier: RiskTier;
  minCapital: number;
  // continuous strategies
  minReturn?: number;
  maxReturn?: number;
  // binary (prediction markets)
  isBinary?: boolean;
  baseWinProb?: number;       // 0–1
  payoutMultiplier?: number;  // e.g. 1.9 = +90% on win
}

export interface StrategyCard extends Strategy {
  confidence: number;         // 0–100 per round
  thesis: string;             // selected this round
  isRecommended: boolean;
}

export interface Allocation {
  strategyId: string;
  amount: number;
}

export interface PositionResult {
  strategyId: string;
  name: string;
  emoji: string;
  category: StrategyCategory;
  amountInvested: number;
  confidence: number;
  isBinary: boolean;
  wasWin?: boolean;
  returnPct: number;
  profit: number;
  aiWasRight: boolean;
}

export interface RoundResult {
  round: number;
  regime: MarketRegime;
  startBalance: number;
  cards: StrategyCard[];
  allocations: Allocation[];
  positions: PositionResult[];
  endBalance: number;
  totalProfit: number;
}

export type GamePhase = "allocate" | "results";

export interface GameState {
  phase: GamePhase;
  round: number;
  balance: number;
  regime: MarketRegime;
  cards: StrategyCard[];
  history: RoundResult[];
  aiCorrect: number;
  aiTotal: number;
}
