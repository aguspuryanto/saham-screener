import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import { bollingerBands } from './bollinger';

function barsFromCloses(closesArr: number[]): OHLCVBar[] {
  return closesArr.map((close, i) => ({
    date: `bar-${i}`,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000,
  }));
}

describe('bollingerBands', () => {
  it('is symmetric around the middle band', () => {
    const closesArr = [10, 12, 11, 13, 15, 14, 16, 18, 17, 19, 20, 22, 21, 23, 25, 24, 26, 28, 27, 29];
    const bars = barsFromCloses(closesArr);
    const { upper, middle, lower } = bollingerBands(bars, 20, 2);

    const last = bars.length - 1;
    expect(upper[last] - middle[last]).toBeCloseTo(middle[last] - lower[last], 8);
  });

  it('collapses to the middle band when there is no price variation', () => {
    const closesArr = new Array(25).fill(100);
    const bars = barsFromCloses(closesArr);
    const { upper, middle, lower } = bollingerBands(bars, 20, 2);

    const last = bars.length - 1;
    expect(upper[last]).toBeCloseTo(100);
    expect(middle[last]).toBeCloseTo(100);
    expect(lower[last]).toBeCloseTo(100);
  });
});
