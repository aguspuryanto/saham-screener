/**
 * Technical Indicators Calculator
 * Pure functions for computing technical analysis indicators from price/volume data.
 * Uses EOD (End-of-Day) data from PasarDana API.
 */

/**
 * Estimate RSI from multi-period return data.
 * When we don't have day-by-day history, we approximate using available momentum fields.
 * 
 * @param oneDay - 1-day return (decimal, e.g. 0.02 = 2%)
 * @param oneWeek - 1-week return
 * @param oneMonth - 1-month return
 * @param threeMonth - 3-month return
 */
export function estimateRSI(
  oneDay: number,
  oneWeek: number,
  oneMonth: number,
  threeMonth: number
): number {
  // Weight recent periods more heavily
  const weightedReturn = 
    (oneDay * 4) + 
    (oneWeek / 5 * 3) + 
    (oneMonth / 21 * 2) + 
    (threeMonth / 63 * 1);
  
  const avgDailyReturn = weightedReturn / 10;
  
  // Convert daily return to RSI-like scale
  // RSI = 100 - 100/(1+RS), RS = avg_gain/avg_loss
  // We approximate: strong positive momentum → high RSI
  const rsiEstimate = 50 + (avgDailyReturn * 2000);
  return Math.max(10, Math.min(90, Math.round(rsiEstimate)));
}

/**
 * Estimate EMA ratio from momentum data.
 * Returns the ratio of EMA20 to EMA50 (>1 means golden cross territory)
 */
export function estimateEMARatio(
  oneWeek: number,
  oneMonth: number,
  threeMonth: number
): { ema20: number; ema50: number; isGoldenCross: boolean } {
  const shortMomentum = (oneWeek * 5 + oneMonth) / 6;  // ~20-day proxy
  const longMomentum = (oneMonth * 3 + threeMonth) / 4; // ~50-day proxy
  
  const isGoldenCross = shortMomentum > longMomentum;
  
  return {
    ema20: 1 + shortMomentum,
    ema50: 1 + longMomentum,
    isGoldenCross,
  };
}

/**
 * Estimate MACD signal from momentum data.
 * MACD is essentially the difference between short and long EMA.
 */
export function estimateMACD(
  oneDay: number,
  oneWeek: number,
  oneMonth: number
): { macd: number; signal: number; histogram: number; isBullish: boolean } {
  // Short EMA proxy (12-day): weight towards recent
  const shortEMA = (oneDay * 5 + oneWeek / 5 * 7) / 12;
  // Long EMA proxy (26-day): weight towards 1-month
  const longEMA = (oneWeek / 5 * 12 + oneMonth / 21 * 14) / 26;
  
  const macd = shortEMA - longEMA;
  const signal = macd * 0.85; // 9-day signal line approximation
  const histogram = macd - signal;
  
  return {
    macd: parseFloat(macd.toFixed(6)),
    signal: parseFloat(signal.toFixed(6)),
    histogram: parseFloat(histogram.toFixed(6)),
    isBullish: macd > signal,
  };
}

/**
 * Calculate the annualized volatility score (0-100).
 * Uses stdev (annualized standard deviation) and beta.
 */
export function calcVolatilityScore(
  stdevOneYear: number, // annualized stdev (e.g. 0.45 = 45%)
  betaOneYear: number,
  dailyRange: number,   // (high - low) / close for today
  lastClose: number
): number {
  // Daily range as percent
  const dailyRangePct = lastClose > 0 ? dailyRange / lastClose : 0;
  
  // Normalize stdev: 0-20% = low, 20-50% = medium, 50%+ = high
  const stdevScore = Math.min(100, (stdevOneYear / 0.6) * 100);
  
  // Beta score: 0.5-2.5 range typical
  const betaScore = Math.min(100, ((Math.abs(betaOneYear) - 0.3) / 2.0) * 100);
  
  // Daily range score: 0-5% range
  const rangeScore = Math.min(100, (dailyRangePct / 0.05) * 100);
  
  return Math.round((stdevScore * 0.4 + betaScore * 0.3 + rangeScore * 0.3));
}

/**
 * Calculate volume spike score (0-100).
 * Compares current volume to expected based on value/capitalization.
 */
export function calcVolumeSpikeScore(
  volume: number,
  value: number,      // transaction value in IDR
  capitalization: number,
  frequency: number
): number {
  if (capitalization <= 0) return 0;
  
  // Turnover ratio: value / market cap (daily)
  const turnoverRatio = value / capitalization;
  
  // Normal daily turnover ~0.1-0.5% of market cap
  // High turnover = volume spike signal
  const turnoverScore = Math.min(100, (turnoverRatio / 0.005) * 100);
  
  // Frequency score: more transactions = more active
  // 1000 freq = baseline, 10000+ = very high
  const freqScore = Math.min(100, (frequency / 10000) * 100);
  
  return Math.round((turnoverScore * 0.7 + freqScore * 0.3));
}

/**
 * Calculate breakout score (0-100) based on position vs annual range.
 * Higher score = price closer to annual high (potential breakout).
 */
export function calcBreakoutScore(
  lastClose: number,
  annualHigh: number,
  annualLow: number,
  oneDay: number,
  oneWeek: number
): number {
  if (annualHigh <= annualLow) return 50;
  
  const annualRange = annualHigh - annualLow;
  const positionInRange = (lastClose - annualLow) / annualRange; // 0-1
  
  // Sweet spot: 70-95% of annual range (approaching breakout but not overbought)
  let positionScore: number;
  if (positionInRange >= 0.95) {
    positionScore = 70; // Already at top, risky
  } else if (positionInRange >= 0.75) {
    positionScore = 100; // Sweet spot for breakout
  } else if (positionInRange >= 0.5) {
    positionScore = 60; // Middle range
  } else if (positionInRange >= 0.3) {
    positionScore = 40; // Below midpoint
  } else {
    positionScore = 20; // Near annual low
  }
  
  // Boost if recent momentum is positive
  const momentumBonus = (oneDay > 0.01 ? 10 : 0) + (oneWeek > 0.03 ? 10 : 0);
  
  return Math.min(100, Math.round(positionScore + momentumBonus));
}

/**
 * Calculate momentum score (0-100) from multi-period returns.
 */
export function calcMomentumScore(
  oneDay: number,
  oneWeek: number,
  oneMonth: number,
  threeMonth: number,
  type: 'swing' | 'scalping'
): number {
  if (type === 'scalping') {
    // Scalping: focus on very recent momentum (today + this week)
    const dayScore = Math.min(100, Math.max(0, (oneDay + 0.02) / 0.05 * 100));
    const weekScore = Math.min(100, Math.max(0, (oneWeek + 0.05) / 0.10 * 100));
    return Math.round(dayScore * 0.7 + weekScore * 0.3);
  } else {
    // Swing: focus on weekly + monthly momentum
    const weekScore = Math.min(100, Math.max(0, (oneWeek + 0.05) / 0.12 * 100));
    const monthScore = Math.min(100, Math.max(0, (oneMonth + 0.1) / 0.20 * 100));
    const quarterScore = Math.min(100, Math.max(0, (threeMonth + 0.15) / 0.35 * 100));
    return Math.round(weekScore * 0.5 + monthScore * 0.3 + quarterScore * 0.2);
  }
}

/**
 * Calculate fundamental safety score (0-100).
 * Used as a safety filter in swing trade scoring.
 */
export function calcFundamentalScore(
  per: number,
  pbr: number,
  roe: number
): number {
  let score = 50; // Baseline
  
  // PE Ratio
  if (per <= 0) {
    score -= 20; // Negative earnings
  } else if (per < 10) {
    score += 25; // Very cheap
  } else if (per < 20) {
    score += 15; // Reasonable
  } else if (per < 30) {
    score += 0;  // Fair
  } else {
    score -= 15; // Expensive
  }
  
  // PBV
  if (pbr < 1) {
    score += 20; // Below book value
  } else if (pbr < 2) {
    score += 10;
  } else if (pbr > 5) {
    score -= 15;
  }
  
  // ROE
  const roePct = roe * 100;
  if (roePct > 20) {
    score += 15; // High return on equity
  } else if (roePct > 10) {
    score += 5;
  } else if (roePct < 0) {
    score -= 20; // Negative ROE
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate entry, target, and stop loss levels.
 */
export function calcTradingLevels(
  lastClose: number,
  annualHigh: number,
  annualLow: number,
  highToday: number,
  lowToday: number,
  type: 'swing' | 'scalping'
): import('../domain/models/Stock').TradingLevels {
  const range = annualHigh - annualLow;
  const support = lastClose - (range * 0.05);
  const resistance = annualHigh;
  
  if (type === 'scalping') {
    const dailyRange = highToday - lowToday;
    const pivot = (highToday + lowToday + lastClose) / 3;
    const r1 = 2 * pivot - lowToday;
    const s1 = 2 * pivot - highToday;
    
    return {
      entry: parseFloat(lastClose.toFixed(0)),
      target1: parseFloat(r1.toFixed(0)),
      target2: parseFloat((r1 + dailyRange * 0.3).toFixed(0)),
      stopLoss: parseFloat(s1.toFixed(0)),
      riskRewardRatio: parseFloat(((r1 - lastClose) / Math.max(1, lastClose - s1)).toFixed(2)),
    };
  } else {
    // Swing: use 5% target, 3% stop loss as base
    const target1 = lastClose * 1.05;
    const target2 = Math.min(resistance, lastClose * 1.10);
    const stopLoss = Math.max(annualLow, lastClose * 0.97);
    
    return {
      entry: parseFloat(lastClose.toFixed(0)),
      target1: parseFloat(target1.toFixed(0)),
      target2: parseFloat(target2.toFixed(0)),
      stopLoss: parseFloat(stopLoss.toFixed(0)),
      riskRewardRatio: parseFloat(((target1 - lastClose) / Math.max(1, lastClose - stopLoss)).toFixed(2)),
    };
  }
}
