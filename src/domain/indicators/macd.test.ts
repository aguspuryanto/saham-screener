import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { macd } from './macd';
import { ema, closes } from './movingAverages';

function barsFromCloses(closesArr: number[]): OHLCVBar[] {
  return closesArr.map((close, i) => ({
    date: `bar-${i}`,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
  }));
}

describe('macd', () => {
  it('macd line equals ema(fast) - ema(slow) at every valid index', () => {
    const closesArr = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 10 + i * 0.5);
    const bars = barsFromCloses(closesArr);
    const { macdLine } = macd(bars, 12, 26, 9);

    const emaFast = ema(closes(bars), 12);
    const emaSlow = ema(closes(bars), 26);

    for (let i = 26; i < bars.length; i++) {
      expect(macdLine[i]).toBeCloseTo(emaFast[i] - emaSlow[i], 8);
    }
  });

  it('histogram equals macdLine - signalLine wherever both are defined', () => {
    const closesArr = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 10 + i * 0.5);
    const bars = barsFromCloses(closesArr);
    const { macdLine, signalLine, histogram } = macd(bars);

    for (let i = 0; i < bars.length; i++) {
      if (!Number.isNaN(macdLine[i]) && !Number.isNaN(signalLine[i])) {
        expect(histogram[i]).toBeCloseTo(macdLine[i] - signalLine[i], 8);
      } else {
        expect(histogram[i]).toBeNaN();
      }
    }
  });
});
