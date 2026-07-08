import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { stochastic } from './stochastic';

function makeBars(n: number, closeAtHigh: boolean): OHLCVBar[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `bar-${i}`,
    open: 10,
    high: 20,
    low: 5,
    close: closeAtHigh ? 20 : 5,
    volume: 1000,
  }));
}

describe('stochastic', () => {
  it('%K is 100 when the close sits at the period high', () => {
    const bars = makeBars(20, true);
    const { k } = stochastic(bars, 14, 3);
    expect(k[19]).toBeCloseTo(100);
  });

  it('%K is 0 when the close sits at the period low', () => {
    const bars = makeBars(20, false);
    const { k } = stochastic(bars, 14, 3);
    expect(k[19]).toBeCloseTo(0);
  });

  it('%D is the moving average of %K and is defined once %K has enough history', () => {
    const bars = makeBars(20, true);
    const { d } = stochastic(bars, 14, 3);
    expect(d[19]).toBeCloseTo(100);
    expect(d[14]).toBeNaN();
    expect(d[15]).toBeCloseTo(100);
  });
});
