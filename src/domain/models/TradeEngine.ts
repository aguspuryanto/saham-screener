export type TradeDecision = 'BUY' | 'WATCH' | 'NO_TRADE';
export type TradeGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'NO_TRADE';

export interface TradeEngineScores {
  trend: number;
  momentum: number;
  liquidity: number;
  smartMoney: number;
  risk: number; // safety score: 100 = safe, 0 = dangerous
  falseBreakout: number; // safety score: 100 = clean, 0 = strong false-breakout signal
  riskReward: number;
  openingStrength: number; // proxy only, see openingStrengthIsProxy
  composite: number;
}

export interface TradeEngineGate {
  label: string;
  passed: boolean;
  detail: string;
}

export interface TradeEngineOutput {
  ticker: string;
  decision: TradeDecision;
  grade: TradeGrade;
  noTradeReasons: string[];
  scores: TradeEngineScores;
  confidence: number;
  probabilityTakeProfit: number;
  probabilityStopLoss: number;
  noTradeProbability: number;
  expectedReturnPct: number;
  expectedDrawdownPct: number;
  riskRewardRatio: number;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit: number[];
  maxPositionSizePct: number;
  explanation: string[];
  gates: TradeEngineGate[];
  openingStrengthIsProxy: boolean;
  dataAvailable: boolean;
  barsUsed: number;
}
