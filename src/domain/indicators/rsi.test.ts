import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { rsi } from './rsi';

function barsFromCloses(closesArr: number[]): OHLCVBar[] {
  return closesArr.map((close, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }));
}

describe('rsi', () => {
  it('is 100 after a pure uptrend (no losses)', () => {
    const closesArr = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = rsi(barsFromCloses(closesArr), 14);
    expect(result[19]).toBeCloseTo(100);
  });

  it('is 0 after a pure downtrend (no gains)', () => {
    const closesArr = Array.from({ length: 20 }, (_, i) => 200 - i);
    const result = rsi(barsFromCloses(closesArr), 14);
    expect(result[19]).toBeCloseTo(0);
  });

  it('returns NaN before enough bars are available', () => {
    const closesArr = [100, 101, 102];
    const result = rsi(barsFromCloses(closesArr), 14);
    expect(result[2]).toBeNaN();
  });
});
