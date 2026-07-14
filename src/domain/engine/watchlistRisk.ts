import { OHLCVBar } from '../models/History';
import { IndicatorSnapshot } from '../indicators';
import { clamp } from './utils';

export interface WatchlistPenalty {
  label: string;
  points: number;
  detail: string;
}

/**
 * The explicit penalty table from the spec, applied ONCE to the final composite
 * (not folded into the 10%-weighted Risk category below) — this is what keeps
 * danger signals from being diluted to near-nothing by a light category weight.
 * RSI>88 is intentionally excluded here: it's already penalized inside
 * `watchlistMomentum.ts` per the spec's own category-A wording.
 */
export function computeWatchlistPenalties(snapshot: IndicatorSnapshot, bars: OHLCVBar[]): WatchlistPenalty[] {
  const penalties: WatchlistPenalty[] = [];

  const gap = snapshot.gapPct;
  if (gap > 15) {
    penalties.push({ label: 'Gap terlalu besar', points: 20, detail: `Gap ${gap.toFixed(1)}% (>15%)` });
  } else if (gap > 8) {
    penalties.push({ label: 'Gap besar', points: 12, detail: `Gap ${gap.toFixed(1)}% (>8%)` });
  }

  if (Number.isFinite(snapshot.resistance) && snapshot.resistance > 0) {
    const roomPct = ((snapshot.resistance - snapshot.lastClose) / snapshot.lastClose) * 100;
    if (roomPct < 2 && roomPct >= 0) {
      penalties.push({ label: 'Terlalu dekat resistance', points: 10, detail: `Ruang ${roomPct.toFixed(1)}%` });
    }
  }

  if (snapshot.lastClose < snapshot.prevClose && snapshot.relativeVolume > 1.3) {
    penalties.push({
      label: 'Sinyal distribusi',
      points: 15,
      detail: `Candle turun, RVOL ${snapshot.relativeVolume.toFixed(1)}x`,
    });
  }

  if (snapshot.upperShadowPct > 40) {
    penalties.push({
      label: 'Long upper shadow',
      points: 10,
      detail: `Upper shadow ${snapshot.upperShadowPct.toFixed(0)}%`,
    });
  }

  if (snapshot.prevClose > 0) {
    const oneDayGainPct = ((snapshot.lastClose - snapshot.prevClose) / snapshot.prevClose) * 100;
    if (oneDayGainPct > 25) {
      penalties.push({ label: 'Kenaikan >25% sehari', points: 15, detail: `+${oneDayGainPct.toFixed(1)}%` });
    }
  }

  const lastThree = bars.slice(-3);
  if (lastThree.length === 3) {
    const allGreen = lastThree.every((b) => b.close > b.open);
    const cumGainPct =
      lastThree[0].open > 0 ? ((lastThree[2].close - lastThree[0].open) / lastThree[0].open) * 100 : 0;
    if (allGreen && cumGainPct > 15) {
      penalties.push({
        label: '3 hari hijau berturut-turut, kenaikan besar',
        points: 10,
        detail: `+${cumGainPct.toFixed(1)}% dalam 3 hari`,
      });
    }
  }

  const atrPct = snapshot.lastClose > 0 ? (snapshot.atr14 / snapshot.lastClose) * 100 : 0;
  if (atrPct > 7) {
    penalties.push({ label: 'Volatilitas ekstrem', points: 10, detail: `ATR ${atrPct.toFixed(1)}% dari harga` });
  }

  return penalties;
}

/**
 * The 10%-weighted Risk category itself — a lighter baseline safety read
 * (volatility regime + active-distribution flag), distinct from the penalty
 * table above so the two don't double-count the same signal twice at full
 * strength.
 */
export function computeWatchlistRiskCategory(snapshot: IndicatorSnapshot): number {
  let score = 70;

  const atrPct = snapshot.lastClose > 0 ? (snapshot.atr14 / snapshot.lastClose) * 100 : 0;
  if (atrPct >= 1 && atrPct <= 5) score += 15;
  else if (atrPct > 7) score -= 20;

  if (snapshot.lastClose < snapshot.prevClose && snapshot.relativeVolume > 1.3) score -= 20;

  return Math.round(clamp(score, 0, 100));
}
