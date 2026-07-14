import { OHLCVBar } from '../models/History';
import { IndicatorSnapshot } from '../indicators';
import { clamp } from './utils';

export interface FalseBreakoutScoreResult {
  score: number; // 100 = clean close, 0 = strong false-breakout / distribution signal
  detail: string[];
}

/**
 * Detects the exact pattern behind chase-and-dump setups: a candle that *looks*
 * like a breakout (green, high RVOL, near the day's high on a headline basis) but
 * whose internals — shadow, close position, divergence — say sellers showed up
 * into strength. This is what separates BKDP-style "close near high, RVOL 5" from
 * a genuinely clean breakout.
 */
export function computeFalseBreakoutScore(snapshot: IndicatorSnapshot, bars: OHLCVBar[]): FalseBreakoutScoreResult {
  const detail: string[] = [];
  let penalty = 0;

  if (snapshot.upperShadowPct > 40) {
    penalty += 20;
    detail.push(`Upper shadow panjang (${snapshot.upperShadowPct.toFixed(0)}%) — penolakan di level tinggi`);
  } else if (snapshot.upperShadowPct > 25) {
    penalty += 10;
    detail.push(`Upper shadow cukup panjang (${snapshot.upperShadowPct.toFixed(0)}%)`);
  }

  const range = snapshot.lastHigh - snapshot.lastLow;
  const closeFromHighPct = range > 0 ? ((snapshot.lastHigh - snapshot.lastClose) / range) * 100 : 0;
  if (closeFromHighPct > 50) {
    penalty += 15;
    detail.push('Close jauh di bawah high intraday — momentum tidak bertahan sampai closing');
  } else if (closeFromHighPct > 30) {
    penalty += 7;
    detail.push('Close agak jauh dari high intraday');
  }

  const lastThree = bars.slice(-3);
  if (lastThree.length === 3) {
    const cumGainPct =
      lastThree[0].open > 0 ? ((lastThree[2].close - lastThree[0].open) / lastThree[0].open) * 100 : 0;
    if (snapshot.relativeVolume > 2 && cumGainPct > 10) {
      penalty += 20;
      detail.push(`Volume klimaks (${snapshot.relativeVolume.toFixed(1)}x) setelah rally ${cumGainPct.toFixed(1)}% — indikasi distribusi`);
    }
  }

  if (snapshot.lastClose < snapshot.prevClose && snapshot.relativeVolume > 1.3) {
    penalty += 15;
    detail.push('Candle turun dengan volume di atas rata-rata — tekanan jual aktif');
  }

  if (snapshot.higherHigh && snapshot.rsi14 < snapshot.prevRsi14 && snapshot.rsi14 > 60) {
    penalty += 20;
    detail.push('Higher High terbentuk tapi RSI menurun — bearish divergence');
  }

  const score = Math.round(clamp(100 - penalty, 0, 100));
  if (detail.length === 0) detail.push('Tidak ada indikasi false breakout — close relatif bersih');

  return { score, detail };
}
