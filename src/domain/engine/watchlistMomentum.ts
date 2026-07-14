import { IndicatorSnapshot } from '../indicators';
import { clamp } from './utils';

export interface WatchlistMomentumResult {
  score: number;
  detail: string[];
}

/**
 * Stage 1 (After Market AI) momentum category — 30% weight. Close near high,
 * break of the highest high, full EMA20>EMA50>EMA100 stack, MACD bullish, and an
 * RSI 60-70 sweet spot. RSI>88 is penalized *here* (not in the separate penalty
 * table) per the spec, which ties this specific penalty to momentum: "sering
 * profit taking".
 */
export function computeWatchlistMomentumScore(snapshot: IndicatorSnapshot): WatchlistMomentumResult {
  let score = 50;
  const detail: string[] = [];

  const range = snapshot.lastHigh - snapshot.lastLow;
  const closeNearHigh = range > 0 ? (snapshot.lastClose - snapshot.lastLow) / range : 0.5;
  if (closeNearHigh > 0.7) {
    score += 10;
    detail.push('Close dekat high harian');
  }

  if (Number.isFinite(snapshot.highestHigh20) && snapshot.lastClose >= snapshot.highestHigh20) {
    score += 15;
    detail.push('Break highest high 20 hari');
  }

  const emaStackKnown = Number.isFinite(snapshot.ema100);
  if (emaStackKnown && snapshot.ema20 > snapshot.ema50 && snapshot.ema50 > snapshot.ema100) {
    score += 15;
    detail.push('EMA20 > EMA50 > EMA100 (stack bullish penuh)');
  } else if (snapshot.ema20 > snapshot.ema50) {
    score += 7;
    detail.push('EMA20 > EMA50 (stack sebagian, EMA100 belum tersedia atau belum align)');
  }

  if (snapshot.macd > snapshot.macdSignal) {
    score += 10;
    detail.push('MACD bullish');
  }

  const rsi = snapshot.rsi14;
  if (rsi > 88) {
    score -= 15;
    detail.push(`RSI ${rsi.toFixed(0)} — risiko profit taking tinggi (>88)`);
  } else if (rsi >= 60 && rsi <= 70) {
    score += 15;
    detail.push(`RSI ${rsi.toFixed(0)} — zona optimal (60-70)`);
  } else if (rsi > 70 && rsi <= 80) {
    score += 8;
    detail.push(`RSI ${rsi.toFixed(0)} — masih baik (70-80)`);
  } else if (rsi < 50) {
    score -= 8;
    detail.push(`RSI ${rsi.toFixed(0)} — momentum belum terkonfirmasi (<50)`);
  }

  if (detail.length === 0) detail.push('Tidak ada sinyal momentum signifikan');

  return { score: Math.round(clamp(score, 0, 100)), detail };
}
