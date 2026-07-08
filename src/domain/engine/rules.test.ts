import { describe, it, expect } from 'vitest';
import { applyRules, RuleContext } from './rules';
import { makeSnapshot, makeStock } from './testFixtures';
import { AiScores } from '../models/AiEngine';

const baseScores: AiScores = {
  liquidity: 50,
  momentum: 50,
  trend: 50,
  volatility: 50,
  smart_money: 50,
  distribution: 50,
  fundamental: 50,
};

function makeContext(overrides: Partial<RuleContext['snapshot']> = {}): RuleContext {
  return {
    snapshot: makeSnapshot(overrides),
    patterns: [],
    bars: [],
    stock: makeStock(),
    scores: baseScores,
  };
}

describe('bullish_momentum_combo (aistock.md example 1)', () => {
  it('fires when Close>EMA20, EMA9>EMA20, RSI 55-70, Volume>2xMA20, ATR rising, and Higher High', () => {
    const ctx = makeContext({
      lastClose: 110,
      ema20: 100,
      ema9: 105,
      rsi14: 60,
      relativeVolume: 2.5,
      atr14: 3,
      prevAtr14: 2,
      higherHigh: true,
    });

    const result = applyRules(ctx);
    expect(result.firedRuleIds).toContain('bullish_momentum_combo');
    expect(result.scoreDeltas.momentum).toBeGreaterThan(0);
    expect(result.scoreDeltas.trend).toBeGreaterThan(0);
    expect(result.swingProbDeltas.take_profit).toBeGreaterThan(0);
  });

  it('does not fire when RSI is outside the 55-70 window', () => {
    const ctx = makeContext({
      lastClose: 110,
      ema20: 100,
      ema9: 105,
      rsi14: 80,
      relativeVolume: 2.5,
      atr14: 3,
      prevAtr14: 2,
      higherHigh: true,
    });

    const result = applyRules(ctx);
    expect(result.firedRuleIds).not.toContain('bullish_momentum_combo');
  });
});

describe('bearish_distribution_combo (aistock.md example 2)', () => {
  it('fires when there is a long upper shadow, big volume, and close near the low', () => {
    const ctx = makeContext({
      upperShadowPct: 50,
      relativeVolume: 2.5,
      lastHigh: 110,
      lastLow: 100,
      lastClose: 101, // near low: (101-100)/(110-100) = 0.1 < 0.3
    });

    const result = applyRules(ctx);
    expect(result.firedRuleIds).toContain('bearish_distribution_combo');
    expect(result.scoreDeltas.distribution).toBeGreaterThan(0);
    expect(result.swingProbDeltas.stop_loss).toBeGreaterThan(0);
    expect(result.scalpProbDeltas.false_breakout).toBeGreaterThan(0);
  });

  it('does not fire when the close is near the high instead of the low', () => {
    const ctx = makeContext({
      upperShadowPct: 50,
      relativeVolume: 2.5,
      lastHigh: 110,
      lastLow: 100,
      lastClose: 108,
    });

    const result = applyRules(ctx);
    expect(result.firedRuleIds).not.toContain('bearish_distribution_combo');
  });
});

describe('applyRules weighting', () => {
  it('scales fired rule deltas by the provided weight', () => {
    const ctx = makeContext({ rsi14: 20, stochasticK: 10 });

    const fullWeight = applyRules(ctx, { oversold_reversal: 1 });
    const halfWeight = applyRules(ctx, { oversold_reversal: 0.5 });

    expect(fullWeight.scoreDeltas.momentum).toBeCloseTo((halfWeight.scoreDeltas.momentum ?? 0) * 2);
  });
});
