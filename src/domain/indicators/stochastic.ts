import { OHLCVBar } from '../models/History';
import { sma } from './movingAverages';

export interface StochasticResult {
  k: number[];
  d: number[];
}

export function stochastic(bars: OHLCVBar[], kPeriod = 14, dPeriod = 3): StochasticResult {
  const k: number[] = new Array(bars.length).fill(NaN);

  for (let i = kPeriod - 1; i < bars.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      highestHigh = Math.max(highestHigh, bars[j].high);
      lowestLow = Math.min(lowestLow, bars[j].low);
    }
    const range = highestHigh - lowestLow;
    k[i] = range === 0 ? 50 : ((bars[i].close - lowestLow) / range) * 100;
  }

  const firstValidIndex = k.findIndex((v) => !Number.isNaN(v));
  const d: number[] = new Array(k.length).fill(NaN);
  if (firstValidIndex >= 0) {
    const kTail = k.slice(firstValidIndex);
    const dTail = sma(kTail, dPeriod);
    for (let i = 0; i < dTail.length; i++) {
      d[firstValidIndex + i] = dTail[i];
    }
  }

  return { k, d };
}
