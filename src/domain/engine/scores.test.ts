import { describe, it, expect } from 'vitest';
import { OHLCVBar } from '../models/History';
import {
  computeLiquidityScore,
  computeMomentumScore,
  computeTrendScore,
  computeVolatilityScore,
  computeSmartMoneyScore,
  computeDistributionScore,
  computeFundamentalScore,
} from './scores';
import { makeSnapshot, makeStock } from './testFixtures';

describe('computeMomentumScore', () => {
  it('scores a fully bullish setup higher than a fully bearish one', () => {
    const bullish = makeSnapshot({
      ema9: 105,
      ema20: 100,
      ema50: 95,
      macd: 2,
      macdSignal: 1,
      rsi14: 60,
      higherHigh: true,
      higherLow: true,
      relativeVolume: 2,
    });
    const bearish = makeSnapshot({
      ema9: 95,
      ema20: 100,
      ema50: 105,
      macd: -2,
      macdSignal: -1,
      rsi14: 25,
      higherHigh: false,
      higherLow: false,
      relativeVolume: 0.8,
    });

    expect(computeMomentumScore(bullish)).toBeGreaterThan(computeMomentumScore(bearish));
  });
});

describe('computeTrendScore', () => {
  it('classifies a strong bullish EMA stack with high ADX as Strong Uptrend', () => {
    const snapshot = makeSnapshot({ lastClose: 110, ema20: 105, ema50: 100, adx14: 30 });
    const { category, score } = computeTrendScore(snapshot);
    expect(category).toBe('Strong Uptrend');
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('classifies a bearish EMA stack with high ADX as Strong Downtrend', () => {
    const snapshot = makeSnapshot({ lastClose: 90, ema20: 95, ema50: 100, adx14: 30 });
    const { category } = computeTrendScore(snapshot);
    expect(category).toBe('Strong Downtrend');
  });

  it('classifies a flat market as Sideways', () => {
    const snapshot = makeSnapshot({ lastClose: 100, ema20: 100, ema50: 100, adx14: 10 });
    const { category } = computeTrendScore(snapshot);
    expect(category).toBe('Sideways');
  });
});

describe('computeVolatilityScore', () => {
  it('penalizes both extremely low and extremely high volatility', () => {
    const flat = makeSnapshot({ lastClose: 100, atr14: 0.1 });
    const ideal = makeSnapshot({ lastClose: 100, atr14: 2.5 });
    const wild = makeSnapshot({ lastClose: 100, atr14: 15 });

    expect(computeVolatilityScore(ideal)).toBeGreaterThan(computeVolatilityScore(flat));
    expect(computeVolatilityScore(ideal)).toBeGreaterThan(computeVolatilityScore(wild));
  });
});

describe('computeSmartMoneyScore', () => {
  it('rewards accumulation signals: close near high, higher lows, rising volume with rising price', () => {
    const accumulation = makeSnapshot({
      lastHigh: 105,
      lastLow: 95,
      lastClose: 104,
      prevClose: 100,
      higherLow: true,
      relativeVolume: 1.5,
      avgTransactionValue: 10_000_000_000,
      ema9: 102,
      ema20: 100,
    });
    const neutral = makeSnapshot();

    expect(computeSmartMoneyScore(accumulation)).toBeGreaterThan(computeSmartMoneyScore(neutral));
  });
});

describe('computeDistributionScore', () => {
  const bars: OHLCVBar[] = [
    { date: 'd1', open: 100, high: 102, low: 95, close: 96, volume: 1000 },
    { date: 'd2', open: 96, high: 98, low: 90, close: 91, volume: 1000 },
    { date: 'd3', open: 91, high: 93, low: 85, close: 86, volume: 1000 },
  ];

  it('scores higher when volume rises while price falls with three red candles', () => {
    const distributive = makeSnapshot({
      relativeVolume: 2,
      lastClose: 86,
      prevClose: 91,
      upperShadowPct: 50,
    });
    expect(computeDistributionScore(distributive, bars)).toBeGreaterThan(
      computeDistributionScore(makeSnapshot(), [])
    );
  });
});

describe('computeFundamentalScore', () => {
  it('rewards cheap valuation with strong ROE', () => {
    const cheap = makeStock({ fundamental: { pbv: 0.8, per: 8, eps: 12.5, dy: 0, roe: 25 } });
    const expensive = makeStock({ fundamental: { pbv: 6, per: 40, eps: 2.5, dy: 0, roe: -5 } });

    expect(computeFundamentalScore(cheap)).toBeGreaterThan(computeFundamentalScore(expensive));
  });
});

describe('computeLiquidityScore', () => {
  it('scores high-turnover stocks higher than illiquid ones', () => {
    const stock = makeStock({ capitalization: 1_000_000_000_000 });
    const liquid = makeSnapshot({ avgTransactionValue: 30_000_000_000, relativeVolume: 2 });
    const illiquid = makeSnapshot({ avgTransactionValue: 10_000_000, relativeVolume: 0.3 });

    expect(computeLiquidityScore(liquid, stock)).toBeGreaterThan(computeLiquidityScore(illiquid, stock));
  });
});
