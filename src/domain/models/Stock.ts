export interface TechnicalIndicators {
  rsi14: number;
  rsi12: number;
  macd: number;
  macdSignal: number;
  ema20: number;
  ema50: number;
  volRatio: number;
}

export interface FundamentalMetrics {
  pbv: number;
  per: number;
  eps: number;
  dy: number;
  roe: number;
}

export interface DCFValuation {
  intrinsicValue: number;
  status: 'Undervalued' | 'Fair Value' | 'Overvalued';
}

export interface BrokerConsensus {
  rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  analystsCount: number;
  averageRating: number;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  lastClose: number;
  percentChange: number;
  technical: TechnicalIndicators;
  fundamental: FundamentalMetrics;
  dcf: DCFValuation;
  consensus: BrokerConsensus;
  recommendation: 'BUY' | 'ACCUMULATE' | 'HOLD' | 'SELL' | 'REDUCE' | 'NEUTRAL';
  strategy: 'Momentum' | 'Reversal' | 'Breakout' | 'Consolidation';
  lastUpdated: string;
}
