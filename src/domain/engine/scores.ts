import { OHLCVBar } from '../models/History';
import { Stock } from '../models/Stock';
import { IndicatorSnapshot } from '../indicators';
import { TrendCategory } from '../models/AiEngine';
import { clamp } from './utils';

export function computeLiquidityScore(snapshot: IndicatorSnapshot, stock: Stock): number {
  const capitalization = stock.capitalization || 1;
  const turnoverRatio = snapshot.avgTransactionValue / capitalization;
  const turnoverScore = clamp((turnoverRatio / 0.005) * 100, 0, 100);
  const absoluteValueScore = clamp((snapshot.avgTransactionValue / 20_000_000_000) * 100, 0, 100);
  const relVolScore = clamp((snapshot.relativeVolume / 1.5) * 100, 0, 100);

  return Math.round(turnoverScore * 0.5 + absoluteValueScore * 0.3 + relVolScore * 0.2);
}

export function computeMomentumScore(snapshot: IndicatorSnapshot): number {
  let score = 50;

  score += snapshot.ema9 > snapshot.ema20 ? 15 : -15;
  score += snapshot.ema20 > snapshot.ema50 ? 10 : -5;
  score += snapshot.macd > snapshot.macdSignal ? 10 : -10;

  if (snapshot.rsi14 >= 50 && snapshot.rsi14 <= 70) score += 15;
  else if (snapshot.rsi14 > 70) score -= 5;
  else if (snapshot.rsi14 < 30) score -= 10;

  if (snapshot.higherHigh) score += 5;
  if (snapshot.higherLow) score += 5;
  if (snapshot.relativeVolume > 1.5) score += 10;

  return Math.round(clamp(score, 0, 100));
}

export function computeTrendScore(snapshot: IndicatorSnapshot): { score: number; category: TrendCategory } {
  const emaBullish = snapshot.lastClose > snapshot.ema20 && snapshot.ema20 > snapshot.ema50;
  const emaBearish = snapshot.lastClose < snapshot.ema20 && snapshot.ema20 < snapshot.ema50;
  const strongAdx = snapshot.adx14 >= 25;

  let category: TrendCategory;
  let score: number;

  if (emaBullish && strongAdx) {
    category = 'Strong Uptrend';
    score = 90;
  } else if (emaBullish) {
    category = 'Uptrend';
    score = 70;
  } else if (emaBearish && strongAdx) {
    category = 'Strong Downtrend';
    score = 10;
  } else if (emaBearish) {
    category = 'Downtrend';
    score = 30;
  } else {
    category = 'Sideways';
    score = 50;
  }

  return { score, category };
}

export function computeVolatilityScore(snapshot: IndicatorSnapshot): number {
  const atrPct = snapshot.lastClose > 0 ? (snapshot.atr14 / snapshot.lastClose) * 100 : 0;

  if (atrPct < 0.5) return 20;
  if (atrPct < 1.5) return 60;
  if (atrPct <= 4) return 90;
  if (atrPct <= 7) return 55;
  return 20;
}

export function computeSmartMoneyScore(snapshot: IndicatorSnapshot): number {
  let score = 40;

  const range = snapshot.lastHigh - snapshot.lastLow;
  const closeNearHigh = range > 0 ? (snapshot.lastClose - snapshot.lastLow) / range : 0.5;

  if (closeNearHigh > 0.7) score += 15;
  if (snapshot.higherLow) score += 15;
  if (snapshot.relativeVolume > 1.3 && snapshot.lastClose >= snapshot.prevClose) score += 15;
  if (snapshot.avgTransactionValue > 5_000_000_000) score += 10;
  if (snapshot.ema9 > snapshot.ema20) score += 5;

  return Math.round(clamp(score, 0, 100));
}

export function computeDistributionScore(snapshot: IndicatorSnapshot, bars: OHLCVBar[]): number {
  let score = 20;

  if (snapshot.relativeVolume > 1.3 && snapshot.lastClose < snapshot.prevClose) score += 25;
  if (snapshot.upperShadowPct > 40) score += 15;

  const lastThree = bars.slice(-3);
  if (lastThree.length === 3 && lastThree.every((b) => b.close < b.open)) score += 20;

  if (snapshot.higherHigh && snapshot.rsi14 < snapshot.prevRsi14 && snapshot.rsi14 > 60) score += 20;

  return Math.round(clamp(score, 0, 100));
}

export function computeFundamentalScore(stock: Stock): number {
  const { per, pbv, roe } = stock.fundamental;
  let score = 50;

  if (per <= 0) score -= 20;
  else if (per < 10) score += 20;
  else if (per < 20) score += 10;
  else if (per < 30) score += 0;
  else score -= 15;

  if (pbv > 0 && pbv < 1) score += 15;
  else if (pbv < 2) score += 5;
  else if (pbv > 5) score -= 15;

  if (roe > 20) score += 15;
  else if (roe > 10) score += 5;
  else if (roe < 0) score -= 20;

  return Math.round(clamp(score, 0, 100));
}
