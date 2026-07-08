import { OHLCVBar } from '../models/History';
import { sma, lastValid } from './movingAverages';

export function volumeMA20(bars: OHLCVBar[], period = 20): number {
  const volumes = bars.map((b) => b.volume);
  return lastValid(sma(volumes, period));
}

export function relativeVolume(bars: OHLCVBar[], period = 20): number {
  if (bars.length === 0) return NaN;
  const avgVol = volumeMA20(bars, period);
  const lastVol = bars[bars.length - 1].volume;
  if (!avgVol || Number.isNaN(avgVol) || avgVol === 0) return NaN;
  return lastVol / avgVol;
}

export function avgTransactionValue(bars: OHLCVBar[], period = 20): number {
  const tail = bars.slice(-period);
  if (tail.length === 0) return NaN;
  const total = tail.reduce((sum, b) => sum + b.close * b.volume, 0);
  return total / tail.length;
}

export function avgDailyRangePct(bars: OHLCVBar[], period = 14): number {
  const tail = bars.slice(-period);
  if (tail.length === 0) return NaN;
  const total = tail.reduce((sum, b) => sum + (b.close > 0 ? ((b.high - b.low) / b.close) * 100 : 0), 0);
  return total / tail.length;
}
