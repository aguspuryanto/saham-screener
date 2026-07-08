import { OHLCVBar } from '../models/History';

export function closes(bars: OHLCVBar[]): number[] {
  return bars.map((b) => b.close);
}

export function sma(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) result[i] = sum / period;
  }
  return result;
}

export function ema(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length < period) return result;

  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  seed /= period;
  result[period - 1] = seed;

  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

export function stdev(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  const means = sma(values, period);
  for (let i = period - 1; i < values.length; i++) {
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (values[j] - means[i]) ** 2;
    }
    result[i] = Math.sqrt(sumSq / period);
  }
  return result;
}

export function lastValid(series: number[]): number {
  for (let i = series.length - 1; i >= 0; i--) {
    if (!Number.isNaN(series[i])) return series[i];
  }
  return NaN;
}

export function valueAt(series: number[], indexFromEnd: number): number {
  const idx = series.length - 1 - indexFromEnd;
  if (idx < 0 || idx >= series.length) return NaN;
  return series[idx];
}
