import { describe, it, expect } from 'vitest';
import { sma, ema } from './movingAverages';

describe('sma', () => {
  it('computes the simple moving average with correct warm-up NaNs', () => {
    const values = [1, 2, 3, 4, 5];
    const result = sma(values, 3);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBeCloseTo(2);
    expect(result[3]).toBeCloseTo(3);
    expect(result[4]).toBeCloseTo(4);
  });
});

describe('ema', () => {
  it('seeds with the SMA and recurses using the standard smoothing factor', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = ema(values, 3);
    expect(result[0]).toBeNaN();
    expect(result[1]).toBeNaN();
    expect(result[2]).toBeCloseTo(2); // seed = avg(1,2,3)
    expect(result[3]).toBeCloseTo(3); // 4*0.5 + 2*0.5
    expect(result[4]).toBeCloseTo(4);
    expect(result[6]).toBeCloseTo(6);
  });
});
