import { OHLCVBar } from '../models/History';
import { IndicatorSnapshot } from '../indicators';
import { tightConsolidation, baseFormation, ascendingTriangleish, flagPennantish } from '../indicators/structurePatterns';
import { clamp } from './utils';

export interface WatchlistStructureResult {
  score: number;
  detail: string[];
}

/**
 * Stage 1 structure category — 15% weight. Higher High / Higher Low reuse the
 * existing swing-point logic (`priceStructure.ts`); consolidation/base/triangle/
 * flag are best-effort heuristics (see `structurePatterns.ts`), not rigorous
 * chart-pattern recognition.
 */
export function computeStructureScore(snapshot: IndicatorSnapshot, bars: OHLCVBar[]): WatchlistStructureResult {
  let score = 40;
  const detail: string[] = [];

  if (snapshot.higherHigh) {
    score += 10;
    detail.push('Higher High terbentuk');
  }
  if (snapshot.higherLow) {
    score += 10;
    detail.push('Higher Low terbentuk');
  }
  if (Number.isFinite(snapshot.resistance) && snapshot.lastClose >= snapshot.resistance) {
    score += 10;
    detail.push('Break resistance');
  }
  if (tightConsolidation(bars)) {
    score += 10;
    detail.push('Tight consolidation (10 hari terakhir)');
  }
  if (baseFormation(bars)) {
    score += 8;
    detail.push('Base formation (15 hari terakhir)');
  }
  if (ascendingTriangleish(bars)) {
    score += 12;
    detail.push('Pola ascending triangle (resistance flat, low naik)');
  }
  if (flagPennantish(bars)) {
    score += 10;
    detail.push('Pola flag/pennant setelah impulse move');
  }

  if (detail.length === 0) detail.push('Belum ada struktur bullish yang jelas — pantau, jangan kejar');

  return { score: Math.round(clamp(score, 0, 100)), detail };
}
