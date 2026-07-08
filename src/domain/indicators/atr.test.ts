import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { atr, trueRange } from './atr';

const bars: OHLCVBar[] = [
  { date: 'd1', open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { date: 'd2', open: 11, high: 13, low: 10, close: 12, volume: 100 },
  { date: 'd3', open: 12, high: 14, low: 11, close: 13, volume: 100 },
  { date: 'd4', open: 13, high: 15, low: 12, close: 14, volume: 100 },
];

describe('trueRange', () => {
  it('uses high-low for the first bar (no previous close)', () => {
    const tr = trueRange(bars);
    expect(tr[0]).toBe(12 - 9);
  });

  it('uses the max of the three true range components afterwards', () => {
    const tr = trueRange(bars);
    // bar 2: high-low=3, |high-prevClose|=|13-11|=2, |low-prevClose|=|10-11|=1 -> max=3
    expect(tr[1]).toBe(3);
  });
});

describe('atr', () => {
  it('seeds with the simple average of the first `period` true ranges', () => {
    const tr = trueRange(bars);
    const result = atr(bars, 4);
    const expectedSeed = (tr[0] + tr[1] + tr[2] + tr[3]) / 4;
    expect(result[3]).toBeCloseTo(expectedSeed);
  });

  it('returns NaN before enough bars', () => {
    const result = atr(bars, 4);
    expect(result[2]).toBeNaN();
  });
});
