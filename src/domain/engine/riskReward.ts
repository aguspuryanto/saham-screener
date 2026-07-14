import { IndicatorSnapshot } from '../indicators';
import { clamp } from './utils';

export interface RiskRewardLayerResult {
  score: number; // 0-100, mapped from riskRewardRatio buckets
  riskRewardRatio: number;
  entry: number;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit: [number, number];
  potentialProfitPct: number;
  potentialLossPct: number;
  detail: string;
}

/**
 * Derives entry/stop/target from the same support & resistance the indicator
 * snapshot already computes, then grades the resulting Risk:Reward against the
 * user's table (<1 very bad ... >2 good) instead of treating every setup as
 * tradeable regardless of how little room is left to the target.
 */
export function computeRiskRewardLayer(snapshot: IndicatorSnapshot): RiskRewardLayerResult {
  const entry = snapshot.lastClose;
  const atr = snapshot.atr14 > 0 ? snapshot.atr14 : entry * 0.01;

  let stopLoss = Number.isFinite(snapshot.support) && snapshot.support > 0
    ? Math.max(snapshot.support, entry - atr * 1.5)
    : entry - atr * 1.5;
  if (stopLoss >= entry) stopLoss = entry - atr;

  const takeProfit1 = entry + atr * 2;
  const resistanceCap = Number.isFinite(snapshot.resistance) && snapshot.resistance > entry
    ? snapshot.resistance
    : takeProfit1 + atr;
  const takeProfit2 = Math.max(takeProfit1 + atr, Math.min(resistanceCap, entry + atr * 3.5));

  const entryZone: [number, number] = [Math.round(entry - atr * 0.3), Math.round(entry)];

  const potentialLoss = Math.max(entry - stopLoss, atr * 0.5);
  const potentialProfit = Math.max(takeProfit1 - entry, atr * 0.5);
  const riskRewardRatio = potentialLoss > 0 ? potentialProfit / potentialLoss : 0;

  let score: number;
  let detail: string;
  if (riskRewardRatio < 1) {
    score = 15;
    detail = `Risk:Reward 1:${riskRewardRatio.toFixed(1)} — sangat buruk (<1:1)`;
  } else if (riskRewardRatio < 1.5) {
    score = 40;
    detail = `Risk:Reward 1:${riskRewardRatio.toFixed(1)} — kurang menarik (1:1-1.5)`;
  } else if (riskRewardRatio < 2) {
    score = 65;
    detail = `Risk:Reward 1:${riskRewardRatio.toFixed(1)} — cukup (1.5:1-2)`;
  } else {
    score = 90;
    detail = `Risk:Reward 1:${riskRewardRatio.toFixed(1)} — baik (>2:1)`;
  }

  return {
    score,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    entry: Math.round(entry),
    entryZone,
    stopLoss: Math.round(stopLoss),
    takeProfit: [Math.round(takeProfit1), Math.round(takeProfit2)],
    potentialProfitPct: (potentialProfit / entry) * 100,
    potentialLossPct: (potentialLoss / entry) * 100,
    detail,
  };
}

/** Fixed-fractional sizing: risk at most ~1% of trading capital per trade. */
export function computePositionSizePct(potentialLossPct: number): number {
  const RISK_CAP_PCT = 1;
  if (potentialLossPct <= 0) return 0;
  return Math.round(clamp((RISK_CAP_PCT / potentialLossPct) * 100, 0, 20) * 10) / 10;
}
