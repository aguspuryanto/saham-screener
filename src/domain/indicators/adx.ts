import { OHLCVBar } from '../models/History';
import { trueRange } from './atr';

function wilderSmooth(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length < period) return result;

  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  result[period - 1] = seed;

  for (let i = period; i < values.length; i++) {
    result[i] = result[i - 1] - result[i - 1] / period + values[i];
  }

  return result;
}

export function adx(bars: OHLCVBar[], period = 14): number[] {
  const n = bars.length;
  const result: number[] = new Array(n).fill(NaN);
  if (n < period * 2) return result;

  const tr = trueRange(bars);
  const plusDM: number[] = new Array(n).fill(0);
  const minusDM: number[] = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const upMove = bars[i].high - bars[i - 1].high;
    const downMove = bars[i - 1].low - bars[i].low;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }

  const smoothedTR = wilderSmooth(tr, period);
  const smoothedPlusDM = wilderSmooth(plusDM, period);
  const smoothedMinusDM = wilderSmooth(minusDM, period);

  const dx: number[] = new Array(n).fill(NaN);
  for (let i = period - 1; i < n; i++) {
    const plusDI = smoothedTR[i] === 0 ? 0 : (smoothedPlusDM[i] / smoothedTR[i]) * 100;
    const minusDI = smoothedTR[i] === 0 ? 0 : (smoothedMinusDM[i] / smoothedTR[i]) * 100;
    const sum = plusDI + minusDI;
    dx[i] = sum === 0 ? 0 : (Math.abs(plusDI - minusDI) / sum) * 100;
  }

  const firstDxIndex = period - 1;
  const dxTail = dx.slice(firstDxIndex);
  if (dxTail.length < period) return result;

  let seedAdx = 0;
  for (let i = 0; i < period; i++) seedAdx += dxTail[i];
  seedAdx /= period;
  result[firstDxIndex + period - 1] = seedAdx;

  for (let i = period; i < dxTail.length; i++) {
    const idx = firstDxIndex + i;
    result[idx] = (result[idx - 1] * (period - 1) + dxTail[i]) / period;
  }

  return result;
}
