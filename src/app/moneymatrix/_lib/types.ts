export type InvestmentType = "stocks" | "crypto" | "realestate" | "sidehustle" | "savings";

export interface Investment {
  type: InvestmentType;
  label: string;
  emoji: string;
  description: string;
  minReturn: number;
  maxReturn: number;
  risk: "low" | "medium" | "high" | "extreme";
  minCapital: number;
}

export interface Allocation {
  type: InvestmentType;
  amount: number;
}

export interface RoundResult {
  type: InvestmentType;
  label: string;
  emoji: string;
  amountInvested: number;
  returnPct: number;
  profit: number;
  event?: string;
}

export interface GameRound {
  round: number;
  startBalance: number;
  allocations: Allocation[];
  results: RoundResult[];
  endBalance: number;
  marketEvent?: MarketEvent;
}

export interface MarketEvent {
  name: string;
  description: string;
  emoji: string;
  multiplier: number;
  affects: InvestmentType[];
}

export type GamePhase = "intro" | "allocate" | "results" | "gameover" | "winner";

export interface GameState {
  phase: GamePhase;
  balance: number;
  round: number;
  history: GameRound[];
  startingBalance: number;
  targetBalance: number;
}
