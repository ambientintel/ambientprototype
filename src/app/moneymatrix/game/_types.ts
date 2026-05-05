export type MarketRegime = "bull" | "bear" | "sideways" | "high_vol" | "euphoria" | "capitulation";
export type StrategyCategory = "prediction" | "crypto" | "equity" | "quant" | "macro";
export type RiskTier = "very_low" | "low" | "medium" | "high" | "extreme";

export interface Strategy {
  id: string;
  name: string;
  emoji: string;
  category: StrategyCategory;
  theses: string[];
  tags: string[];
  riskTier: RiskTier;
  minCapital: number;
  minReturn?: number;
  maxReturn?: number;
  isBinary?: boolean;
  baseWinProb?: number;
  payoutMultiplier?: number;
}

export interface StrategyCard extends Strategy {
  confidence: number;
  thesis: string;
  isRecommended: boolean;
  // Kelly & sealed outcome — computed at card generation, hidden until reveal
  kellyFraction: number;     // optimal fraction of bankroll (0–1)
  sealedReturnPct: number;   // pre-determined outcome for this round
  sealedWin?: boolean;       // for binary strategies
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
  botStartBalance: number;
  cards: StrategyCard[];
  allocations: Allocation[];
  positions: PositionResult[];
  endBalance: number;
  totalProfit: number;
  botProfit: number;         // Kelly bot profit using same sealed outcomes
  botEndBalance: number;
}

export type GamePhase = "allocate" | "results";

export interface GameState {
  phase: GamePhase;
  round: number;
  balance: number;
  botBalance: number;        // Kelly bot's running balance
  regime: MarketRegime;
  cards: StrategyCard[];
  history: RoundResult[];
  aiCorrect: number;
  aiTotal: number;
}
