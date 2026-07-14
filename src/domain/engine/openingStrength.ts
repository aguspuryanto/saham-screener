import { IndicatorSnapshot } from '../indicators';
import { clamp } from './utils';

export interface OpeningStrengthResult {
  score: number;
  isProxy: true;
  detail: string;
}

/**
 * The spec calls for real opening-auction data (bid queue, offer queue, opening
 * volume). This codebase has no order-book / auction feed — `OHLCVBar` is daily
 * open/high/low/close/volume only (see domain/models/History.ts). This is a
 * best-effort proxy from the daily gap and relative volume, flagged `isProxy`
 * so callers can disclose the limitation rather than presenting it as real
 * auction strength.
 */
export function computeOpeningStrengthProxy(snapshot: IndicatorSnapshot): OpeningStrengthResult {
  let score = 50;
  const notes: string[] = [];

  const gap = snapshot.gapPct;
  if (gap > 15) {
    score -= 20;
    notes.push('gap >15% berisiko exhaustion');
  } else if (gap > 8) {
    score += 5;
    notes.push('gap kuat namun mulai diawasi');
  } else if (gap > 0) {
    score += 10;
    notes.push('gap sehat');
  }

  if (snapshot.relativeVolume > 1.5) {
    score += 15;
    notes.push('volume di atas rata-rata');
  } else if (snapshot.relativeVolume < 0.7) {
    score -= 15;
    notes.push('volume di bawah rata-rata');
  }

  const range = snapshot.lastHigh - snapshot.lastLow;
  const closeNearHigh = range > 0 ? (snapshot.lastClose - snapshot.lastLow) / range : 0.5;
  if (closeNearHigh > 0.7) {
    score += 10;
    notes.push('close dekat high harian');
  }

  return {
    score: Math.round(clamp(score, 0, 100)),
    isProxy: true,
    detail: `Estimasi dari gap & volume (${notes.join(', ') || 'netral'}) — data bid/offer auction tidak tersedia`,
  };
}
