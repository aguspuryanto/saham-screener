import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { adx } from './adx';

function makeTrendingBars(n: number): OHLCVBar[] {
  return Array.from({ length: n }, (_, i) => {
    const base = 100 + i * 2;
    return { date: `bar-${i}`, open: base, high: base + 1.5, low: base - 0.5, close: base + 1, volume: 1000 };
  });
}

function makeChoppyBars(n: number): OHLCVBar[] {
  return Array.from({ length: n }, (_, i) => {
    const base = 100 + (i % 2 === 0 ? 1 : -1);
    return { date: `bar-${i}`, open: base, high: base + 1, low: base - 1, close: base, volume: 1000 };
  });
}

describe('adx', () => {
  it('returns NaN before enough bars are available', () => {
    const bars = makeTrendingBars(10);
    const result = adx(bars, 14);
    expect(result[9]).toBeNaN();
  });

  it('stays within the valid 0-100 range once computed', () => {
    const bars = makeTrendingBars(60);
    const result = adx(bars, 14);
    const last = result[result.length - 1];
    expect(last).not.toBeNaN();
    expect(last).toBeGreaterThanOrEqual(0);
    expect(last).toBeLessThanOrEqual(100);
  });

  it('is higher for a steadily trending series than a choppy sideways series', () => {
    const trending = adx(makeTrendingBars(60), 14);
    const choppy = adx(makeChoppyBars(60), 14);
    expect(trending[trending.length - 1]).toBeGreaterThan(choppy[choppy.length - 1]);
  });
});
