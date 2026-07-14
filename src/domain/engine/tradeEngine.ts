import { OHLCVBar } from '../models/History';
import { Stock } from '../models/Stock';
import { computeIndicatorSnapshot } from '../indicators';
import { detectPatterns } from '../patterns/candlestick';
import { TradeEngineOutput } from '../models/TradeEngine';
import { computeLiquidityScore, computeMomentumScore, computeSmartMoneyScore, computeTrendScore } from './scores';
import { computeConfidence } from './probability';
import { computeRiskScore } from './riskScore';
import { computeFalseBreakoutScore } from './falseBreakoutScore';
import { computeRiskRewardLayer, computePositionSizePct } from './riskReward';
import { computeOpeningStrengthProxy } from './openingStrength';
import { decideTrade, GRADE_POSITION_FACTOR } from './tradeDecision';
import { clamp } from './utils';

/**
 * "Is this trade worth taking?" — not "will this stock go up?"
 *
 * Momentum confirmation (RVOL, EMA golden, MACD bullish, close near high) is
 * necessary but never sufficient: it is one of six weighted layers, balanced
 * against an independent Risk layer and False Breakout layer that can drag a
 * momentum-perfect setup down to WATCH or NO_TRADE. See riskScore.ts /
 * falseBreakoutScore.ts for the exact overextension checks this adds.
 *
 * Probabilities below are rule-derived heuristics calibrated by hand, not a
 * statistically fitted model — no labeled historical outcome data exists in
 * this repo yet. They are deliberately capped so the engine can never repeat
 * the "95% probability, -8% next day" failure mode by construction.
 */
export function computeTradeEngineOutput(stock: Stock, bars: OHLCVBar[]): TradeEngineOutput | null {
  const snapshot = computeIndicatorSnapshot(bars);
  if (!snapshot) return null;

  const patterns = detectPatterns(bars);

  const trend = computeTrendScore(snapshot).score;
  const momentum = computeMomentumScore(snapshot);
  const liquidity = computeLiquidityScore(snapshot, stock);
  const smartMoney = computeSmartMoneyScore(snapshot);
  const risk = computeRiskScore(snapshot, bars);
  const falseBreakout = computeFalseBreakoutScore(snapshot, bars);
  const riskRewardLayer = computeRiskRewardLayer(snapshot);
  const openingStrength = computeOpeningStrengthProxy(snapshot);

  const layerScores = {
    trend,
    momentum,
    liquidity,
    smartMoney,
    risk: risk.score,
    falseBreakout: falseBreakout.score,
    riskReward: riskRewardLayer.score,
    openingStrength: openingStrength.score,
  };

  const { decision, grade, composite, gates, noTradeReasons } = decideTrade(
    snapshot,
    layerScores,
    riskRewardLayer.riskRewardRatio
  );

  const confidence = computeConfidence(snapshot, patterns);

  // Capped well below 100% by construction — see module doc.
  const probabilityTakeProfit = Math.round(
    clamp(
      20 + composite * 0.55 - (100 - risk.score) * 0.15 - (100 - falseBreakout.score) * 0.15,
      5,
      82
    )
  );
  const probabilityStopLoss = Math.round(clamp(100 - probabilityTakeProfit, 5, 90));
  const noTradeProbability = Math.round(clamp(35 - Math.abs(composite - 50) * 0.7, 5, 35));

  const expectedReturnPct =
    Math.round(
      ((probabilityTakeProfit / 100) * riskRewardLayer.potentialProfitPct -
        (probabilityStopLoss / 100) * riskRewardLayer.potentialLossPct) *
        10
    ) / 10;

  const atrPct = snapshot.lastClose > 0 ? (snapshot.atr14 / snapshot.lastClose) * 100 : 2;
  const expectedDrawdownPct =
    Math.round(
      clamp(riskRewardLayer.potentialLossPct * (probabilityStopLoss / 100) + atrPct * 0.3, 0.3, 20) * 10
    ) / 10;

  const basePositionSizePct = computePositionSizePct(riskRewardLayer.potentialLossPct);
  const maxPositionSizePct = Math.round(basePositionSizePct * GRADE_POSITION_FACTOR[grade] * 10) / 10;

  const explanation: string[] = [
    `Komposit ${composite}/100 → Grade ${grade} → ${decision.replace('_', ' ')}.`,
    ...risk.detail.map((d) => `[Risk] ${d}`),
    ...falseBreakout.detail.map((d) => `[False Breakout] ${d}`),
    `[Risk:Reward] ${riskRewardLayer.detail}`,
    `[Opening Strength] ${openingStrength.detail}`,
    'Probabilitas & expected value bersifat estimasi berbasis aturan (heuristik), bukan hasil model yang telah dibacktest secara statistik.',
  ];
  if (noTradeReasons.length > 0) {
    explanation.unshift(...noTradeReasons.map((r) => `[NO TRADE] ${r}`));
  }

  return {
    ticker: stock.ticker,
    decision,
    grade,
    noTradeReasons,
    scores: {
      trend,
      momentum,
      liquidity,
      smartMoney,
      risk: risk.score,
      falseBreakout: falseBreakout.score,
      riskReward: riskRewardLayer.score,
      openingStrength: openingStrength.score,
      composite,
    },
    confidence,
    probabilityTakeProfit,
    probabilityStopLoss,
    noTradeProbability,
    expectedReturnPct,
    expectedDrawdownPct,
    riskRewardRatio: riskRewardLayer.riskRewardRatio,
    entryZone: riskRewardLayer.entryZone,
    stopLoss: riskRewardLayer.stopLoss,
    takeProfit: riskRewardLayer.takeProfit,
    maxPositionSizePct,
    explanation,
    gates,
    openingStrengthIsProxy: openingStrength.isProxy,
    dataAvailable: true,
    barsUsed: bars.length,
  };
}
