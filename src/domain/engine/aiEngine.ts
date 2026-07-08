import { OHLCVBar } from '../models/History';
import { Stock } from '../models/Stock';
import { computeIndicatorSnapshot, IndicatorSnapshot } from '../indicators';
import { detectPatterns } from '../patterns/candlestick';
import { AiEngineOutput, AiRecommendation, AiScores, SwingProbability } from '../models/AiEngine';
import {
  computeLiquidityScore,
  computeMomentumScore,
  computeTrendScore,
  computeVolatilityScore,
  computeSmartMoneyScore,
  computeDistributionScore,
  computeFundamentalScore,
} from './scores';
import { applyRules, RuleContext } from './rules';
import { computeBaseSwingProbability, computeBaseScalpingProbability, computeConfidence } from './probability';
import { buildExplanation } from './explanation';
import { clamp } from './utils';

function computeRecommendation(scores: AiScores, confidence: number): AiRecommendation {
  const composite =
    scores.momentum * 0.35 +
    scores.trend * 0.25 +
    scores.smart_money * 0.2 +
    scores.fundamental * 0.1 +
    scores.liquidity * 0.1 -
    scores.distribution * 0.3;

  if (scores.distribution >= 70) return 'AVOID';
  if (composite >= 65 && confidence >= 65) return 'BUY';
  if (composite >= 50) return 'WATCHLIST';
  if (composite >= 35) return 'WAIT';
  return 'AVOID';
}

function computeTradingLevels(snapshot: IndicatorSnapshot) {
  const entry = snapshot.lastClose;
  const atr = snapshot.atr14 > 0 ? snapshot.atr14 : entry * 0.01;

  const stopLoss = Math.max(snapshot.support, entry - atr * 1.5);
  const takeProfit1 = entry + atr * 2;
  const takeProfit2 = Math.max(takeProfit1 + atr, Math.min(snapshot.resistance, entry + atr * 3.5));

  const risk = entry - stopLoss;
  const reward = takeProfit1 - entry;
  const riskReward = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : 'N/A';

  return {
    entry: Math.round(entry),
    stopLoss: Math.round(stopLoss),
    takeProfit: [Math.round(takeProfit1), Math.round(takeProfit2)],
    riskReward,
  };
}

export function computeAiEngineOutput(
  stock: Stock,
  bars: OHLCVBar[],
  ruleWeights: Record<string, number> = {}
): AiEngineOutput | null {
  const snapshot = computeIndicatorSnapshot(bars);
  if (!snapshot) return null;

  const patterns = detectPatterns(bars);

  const baseScores: AiScores = {
    liquidity: computeLiquidityScore(snapshot, stock),
    momentum: computeMomentumScore(snapshot),
    trend: computeTrendScore(snapshot).score,
    volatility: computeVolatilityScore(snapshot),
    smart_money: computeSmartMoneyScore(snapshot),
    distribution: computeDistributionScore(snapshot, bars),
    fundamental: computeFundamentalScore(stock),
  };
  const trendCategory = computeTrendScore(snapshot).category;

  const ruleCtx: RuleContext = { snapshot, patterns, bars, stock, scores: baseScores };
  const applied = applyRules(ruleCtx, ruleWeights);

  const finalScores: AiScores = { ...baseScores };
  (Object.keys(applied.scoreDeltas) as (keyof AiScores)[]).forEach((key) => {
    finalScores[key] = clamp(finalScores[key] + (applied.scoreDeltas[key] ?? 0), 0, 100);
  });

  const baseSwing = computeBaseSwingProbability(finalScores, snapshot);
  const baseScalp = computeBaseScalpingProbability(finalScores, snapshot);

  const swingProbability: SwingProbability = {
    take_profit: Math.round(clamp(baseSwing.take_profit + (applied.swingProbDeltas.take_profit ?? 0), 1, 99)),
    stop_loss: Math.round(clamp(baseSwing.stop_loss + (applied.swingProbDeltas.stop_loss ?? 0), 1, 99)),
    expected_return: baseSwing.expected_return,
    expected_drawdown: baseSwing.expected_drawdown,
  };

  const scalpingProbability = {
    gap_up: Math.round(clamp(baseScalp.gap_up + (applied.scalpProbDeltas.gap_up ?? 0), 1, 99)),
    opening_strength: Math.round(
      clamp(baseScalp.opening_strength + (applied.scalpProbDeltas.opening_strength ?? 0), 1, 99)
    ),
    momentum_continuation: Math.round(
      clamp(baseScalp.momentum_continuation + (applied.scalpProbDeltas.momentum_continuation ?? 0), 1, 99)
    ),
    false_breakout: Math.round(
      clamp(baseScalp.false_breakout + (applied.scalpProbDeltas.false_breakout ?? 0), 1, 99)
    ),
  };

  const confidence = computeConfidence(snapshot, patterns);
  const recommendation = computeRecommendation(finalScores, confidence);
  const { entry, stopLoss, takeProfit, riskReward } = computeTradingLevels(snapshot);

  const explanation = buildExplanation({
    snapshot,
    patterns,
    scores: finalScores,
    trendCategory,
    ruleExplanations: applied.explanations,
  });

  return {
    stock: stock.ticker,
    strategy: 'Swing Trade',
    recommendation,
    confidence,
    swing_probability: swingProbability,
    scalping_probability: scalpingProbability,
    scores: finalScores,
    trend_category: trendCategory,
    entry,
    stop_loss: stopLoss,
    take_profit: takeProfit,
    risk_reward: riskReward,
    explanation,
    data_available: true,
    bars_used: bars.length,
  };
}
