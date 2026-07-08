import { OHLCVBar } from '../models/History';

export function trueRange(bars: OHLCVBar[]): number[] {
  return bars.map((bar, i) => {
    if (i === 0) return bar.high - bar.low;
    const prevClose = bars[i - 1].close;
    return Math.max(
      bar.high - bar.low,
      Math.abs(bar.high - prevClose),
      Math.abs(bar.low - prevClose)
    );
  });
}

export function atr(bars: OHLCVBar[], period = 14): number[] {
  const tr = trueRange(bars);
  const result: number[] = new Array(bars.length).fill(NaN);
  if (bars.length < period) return result;

  let seed = 0;
  for (let i = 0; i < period; i++) seed += tr[i];
  seed /= period;
  result[period - 1] = seed;

  for (let i = period; i < bars.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + tr[i]) / period;
  }

  return result;
}
