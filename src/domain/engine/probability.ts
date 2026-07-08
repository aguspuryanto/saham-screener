import { IndicatorSnapshot } from '../indicators';
import { PatternMatch } from '../patterns/candlestick';
import { AiScores, ScalpingProbability, SwingProbability } from '../models/AiEngine';
import { clamp } from './utils';

export function computeBaseSwingProbability(scores: AiScores, snapshot: IndicatorSnapshot): SwingProbability {
  const atrPct = snapshot.lastClose > 0 ? (snapshot.atr14 / snapshot.lastClose) * 100 : 2;

  const takeProfit = clamp(30 + (scores.momentum - 50) * 0.6 + (scores.trend - 50) * 0.4, 10, 90);
  const stopLoss = clamp(100 - takeProfit + (scores.distribution - 50) * 0.2, 5, 90);
  const expectedReturn = clamp(1 + ((scores.momentum - 50) / 50) * atrPct * 1.5, 0.5, 12);
  const expectedDrawdown = clamp(atrPct * 0.8, 0.3, 8);

  return {
    take_profit: Math.round(takeProfit),
    stop_loss: Math.round(stopLoss),
    expected_return: Math.round(expectedReturn * 10) / 10,
    expected_drawdown: Math.round(expectedDrawdown * 10) / 10,
  };
}

export function computeBaseScalpingProbability(scores: AiScores, snapshot: IndicatorSnapshot): ScalpingProbability {
  const gapUp = clamp(50 + (scores.momentum - 50) * 0.4 + snapshot.gapPct * 5, 5, 95);
  const openingStrength = clamp(50 + (scores.momentum - 50) * 0.5 + (scores.liquidity - 50) * 0.2, 5, 95);
  const momentumContinuation = clamp(scores.momentum, 5, 95);
  const falseBreakout = clamp(100 - scores.momentum * 0.5 + scores.distribution * 0.5, 5, 95);

  return {
    gap_up: Math.round(gapUp),
    opening_strength: Math.round(openingStrength),
    momentum_continuation: Math.round(momentumContinuation),
    false_breakout: Math.round(falseBreakout),
  };
}

export function computeConfidence(snapshot: IndicatorSnapshot, patterns: PatternMatch[]): number {
  let bullish = 0;
  let bearish = 0;
  let total = 0;

  const vote = (isBullish: boolean) => {
    total += 1;
    if (isBullish) bullish += 1;
    else bearish += 1;
  };

  vote(snapshot.ema9 > snapshot.ema20);
  vote(snapshot.ema20 > snapshot.ema50);
  vote(snapshot.macd > snapshot.macdSignal);
  vote(snapshot.rsi14 > 50);
  vote(snapshot.lastClose > snapshot.ema20);
  vote(snapshot.stochasticK > snapshot.stochasticD);

  if (snapshot.higherHigh || snapshot.higherLow) {
    total += 1;
    bullish += 1;
  }

  for (const pattern of patterns) {
    total += 1;
    if (pattern.bullish) bullish += 1;
    else bearish += 1;
  }

  if (total === 0) return 50;

  const agreement = Math.max(bullish, bearish) / total;
  return Math.round(clamp(40 + agreement * 60, 30, 98));
}
