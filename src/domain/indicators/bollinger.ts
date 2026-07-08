import { OHLCVBar } from '../models/History';
import { closes, sma, stdev } from './movingAverages';

export interface BollingerResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function bollingerBands(bars: OHLCVBar[], period = 20, mult = 2): BollingerResult {
  const priceCloses = closes(bars);
  const middle = sma(priceCloses, period);
  const deviation = stdev(priceCloses, period);

  const upper = middle.map((m, i) => (Number.isNaN(m) ? NaN : m + mult * deviation[i]));
  const lower = middle.map((m, i) => (Number.isNaN(m) ? NaN : m - mult * deviation[i]));

  return { upper, middle, lower };
}
