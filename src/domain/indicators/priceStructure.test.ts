import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { highestHigh, lowestLow, gapPct, candleAnatomy } from './priceStructure';

describe('highestHigh / lowestLow', () => {
  const bars: OHLCVBar[] = [
    { date: 'd1', open: 10, high: 15, low: 9, close: 12, volume: 100 },
    { date: 'd2', open: 12, high: 20, low: 11, close: 18, volume: 100 },
    { date: 'd3', open: 18, high: 19, low: 8, close: 15, volume: 100 },
  ];

  it('finds the max high and min low over the lookback window', () => {
    expect(highestHigh(bars, 3)).toBe(20);
    expect(lowestLow(bars, 3)).toBe(8);
  });
});

describe('gapPct', () => {
  it('computes the percentage gap between today open and yesterday close', () => {
    const bars: OHLCVBar[] = [
      { date: 'd1', open: 100, high: 105, low: 99, close: 100, volume: 100 },
      { date: 'd2', open: 102, high: 106, low: 101, close: 104, volume: 100 },
    ];
    expect(gapPct(bars)).toBeCloseTo(2);
  });
});

describe('candleAnatomy', () => {
  it('identifies a doji as having a tiny body relative to its range', () => {
    const bar: OHLCVBar = { date: 'd1', open: 100, high: 105, low: 95, close: 100.2, volume: 100 };
    const { bodyPct } = candleAnatomy(bar);
    expect(bodyPct).toBeLessThan(10);
  });

  it('splits shadows correctly for a bar closing near its high', () => {
    const bar: OHLCVBar = { date: 'd1', open: 95, high: 100, low: 90, close: 99, volume: 100 };
    const anatomy = candleAnatomy(bar);
    expect(anatomy.upperShadowPct).toBeCloseTo(10);
    expect(anatomy.lowerShadowPct).toBeCloseTo(50);
  });
});
