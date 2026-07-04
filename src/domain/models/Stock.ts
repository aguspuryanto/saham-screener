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

export interface SwingScoreBreakdown {
  momentumScore: number;    // Bobot 30%: OneWeek & OneMonth momentum
  breakoutScore: number;    // Bobot 25%: Posisi harga vs annual high/low
  volumeScore: number;      // Bobot 25%: Volume spike vs historical
  fundamentalScore: number; // Bobot 20%: PE, ROE filter keamanan
  totalScore: number;       // 0-100
  signals: string[];        // Deskripsi sinyal yang aktif
}

export interface ScalpingScoreBreakdown {
  volatilityScore: number;  // Bobot 35%: Beta, StDev, daily range
  momentumScore: number;    // Bobot 35%: OneDay, Frequency
  volumeScore: number;      // Bobot 30%: Volume spike
  totalScore: number;       // 0-100
  signals: string[];        // Deskripsi sinyal yang aktif
}

export interface TradingLevels {
  entry: number;
  target1: number;
  target2: number;
  stopLoss: number;
  riskRewardRatio: number;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  subSector: string;
  newSectorName: string;
  lastClose: number;
  prevClose: number;
  highToday: number;
  lowToday: number;
  percentChange: number;
  technical: TechnicalIndicators;
  fundamental: FundamentalMetrics;
  dcf: DCFValuation;
  consensus: BrokerConsensus;
  recommendation: 'BUY' | 'ACCUMULATE' | 'HOLD' | 'SELL' | 'REDUCE' | 'NEUTRAL';
  strategy: 'Momentum' | 'Reversal' | 'Breakout' | 'Consolidation';
  lastUpdated: string;

  // Multi-period returns (as percentage)
  oneDay: number;
  oneWeek: number;
  oneMonth: number;
  threeMonth: number;
  sixMonth: number;
  oneYear: number;

  // Market data
  volume: number;
  value: number;
  frequency: number;
  capitalization: number;

  // Annual range
  annualHigh: number;
  annualLow: number;

  // Risk metrics
  beta: number;
  stdev: number;
  freeFloatPct: number;

  // S.C.A.N. Scoring
  swingScore: SwingScoreBreakdown;
  scalpingScore: ScalpingScoreBreakdown;
  swingLevels: TradingLevels;
  scalpingLevels: TradingLevels;
}
