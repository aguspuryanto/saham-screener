import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { detectPatterns } from './candlestick';

function bar(open: number, high: number, low: number, close: number, date = 'd'): OHLCVBar {
  return { date, open, high, low, close, volume: 1000 };
}

function ids(bars: OHLCVBar[]): string[] {
  return detectPatterns(bars).map((p) => p.id);
}

describe('detectPatterns', () => {
  it('detects a doji (tiny body relative to range)', () => {
    const bars = [bar(90, 95, 85, 88), bar(88, 93, 83, 87), bar(100, 110, 90, 100.3)];
    expect(ids(bars)).toContain('doji');
  });

  it('detects a hammer (small body near the top, long lower shadow)', () => {
    const bars = [bar(90, 95, 85, 88), bar(88, 93, 83, 87), bar(100, 101, 80, 99)];
    expect(ids(bars)).toContain('hammer');
  });

  it('detects a shooting star (small body near the bottom, long upper shadow)', () => {
    const bars = [bar(90, 95, 85, 88), bar(88, 93, 83, 87), bar(100, 120, 99, 101)];
    expect(ids(bars)).toContain('shooting_star');
  });

  it('detects a bullish engulfing pattern', () => {
    const bars = [bar(90, 95, 85, 88), bar(100, 102, 94, 96), bar(95, 108, 94, 107)];
    expect(ids(bars)).toContain('bullish_engulfing');
  });

  it('detects a bearish engulfing pattern', () => {
    const bars = [bar(90, 95, 85, 88), bar(94, 102, 93, 96), bar(97, 98, 88, 89)];
    expect(ids(bars)).toContain('bearish_engulfing');
  });

  it('detects an inside bar (contained within the previous range)', () => {
    const bars = [bar(90, 95, 85, 88), bar(88, 100, 80, 90), bar(90, 95, 85, 91)];
    expect(ids(bars)).toContain('inside_bar');
  });

  it('detects an outside bar (engulfs the previous range)', () => {
    const bars = [bar(90, 95, 85, 88), bar(88, 91, 87, 89), bar(90, 100, 80, 98)];
    expect(ids(bars)).toContain('outside_bar');
  });

  it('detects a morning star reversal', () => {
    const bars = [
      bar(110, 111, 95, 96, 'd1'), // long bearish
      bar(95, 96, 90, 94, 'd2'), // small body, gapped down
      bar(94, 108, 93, 106, 'd3'), // long bullish closing above first candle midpoint
    ];
    expect(ids(bars)).toContain('morning_star');
  });
});
