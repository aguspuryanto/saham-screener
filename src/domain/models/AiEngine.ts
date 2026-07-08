export type AiRecommendation = 'BUY' | 'WATCHLIST' | 'WAIT' | 'AVOID';

export interface AiScores {
  liquidity: number;
  momentum: number;
  trend: number;
  volatility: number;
  smart_money: number;
  distribution: number;
  fundamental: number;
}

export type TrendCategory = 'Strong Uptrend' | 'Uptrend' | 'Sideways' | 'Downtrend' | 'Strong Downtrend';

export interface SwingProbability {
  take_profit: number;
  stop_loss: number;
  expected_return: number;
  expected_drawdown: number;
}

export interface ScalpingProbability {
  gap_up: number;
  opening_strength: number;
  momentum_continuation: number;
  false_breakout: number;
}

export interface AiEngineOutput {
  stock: string;
  strategy: 'Swing Trade' | 'Scalping';
  recommendation: AiRecommendation;
  confidence: number;
  swing_probability: SwingProbability;
  scalping_probability: ScalpingProbability;
  scores: AiScores;
  trend_category: TrendCategory;
  entry: number;
  stop_loss: number;
  take_profit: number[];
  risk_reward: string;
  explanation: string[];
  data_available: boolean;
  bars_used: number;
}
