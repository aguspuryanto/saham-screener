/**
 * S.C.A.N. Scoring Engine
 * Computes Swing Trade Score and Scalping Score from PasarDana EOD data.
 *
 * Swing Trade Score (weights from PRD):
 *   - Momentum      30%: oneWeek & oneMonth momentum
 *   - Breakout      25%: price position vs annual high/low
 *   - Volume Spike  25%: transaction activity vs capitalization
 *   - Fundamental   20%: PE, ROE safety filter
 *
 * Scalping Score (weights from PRD):
 *   - Volatility    35%: beta, stdev, daily range
 *   - Momentum      35%: oneDay, frequency
 *   - Volume Spike  30%: turnover ratio
 */

import {
  calcMomentumScore,
  calcBreakoutScore,
  calcVolumeSpikeScore,
  calcFundamentalScore,
  calcVolatilityScore,
  calcTradingLevels,
  estimateRSI,
  estimateEMARatio,
  estimateMACD,
} from './technicalIndicators';

import type {
  SwingScoreBreakdown,
  ScalpingScoreBreakdown,
  TradingLevels,
} from '../domain/models/Stock';

export interface RawApiStock {
  Code: string;
  Name: string;
  SectorName: string;
  SubSectorName: string;
  NewSectorName: string;
  Last: number;
  PrevClosingPrice: number;
  AdjustedHighPrice: number;
  AdjustedLowPrice: number;
  Volume: number;
  Value: number;
  Frequency: number;
  Capitalization: number;
  OneDay: number;
  OneWeek: number;
  OneMonth: number;
  ThreeMonth: number;
  SixMonth: number;
  OneYear: number;
  Per: number;
  Pbr: number;
  BetaOneYear: number;
  StdevOneYear: number;
  AdjustedAnnualHighPrice: number;
  AdjustedAnnualLowPrice: number;
  LastDate: string;
  LastUpdate: string;
  Roe: number;
  FreeFloatPct: number;
}

export function computeSwingScore(item: RawApiStock): SwingScoreBreakdown {
  const signals: string[] = [];

  const momentumScore = calcMomentumScore(
    item.OneDay || 0,
    item.OneWeek || 0,
    item.OneMonth || 0,
    item.ThreeMonth || 0,
    'swing'
  );

  const breakoutScore = calcBreakoutScore(
    item.Last || 0,
    item.AdjustedAnnualHighPrice || item.Last,
    item.AdjustedAnnualLowPrice || 0,
    item.OneDay || 0,
    item.OneWeek || 0
  );

  const volumeScore = calcVolumeSpikeScore(
    item.Volume || 0,
    item.Value || 0,
    item.Capitalization || 1,
    item.Frequency || 0
  );

  const fundamentalScore = calcFundamentalScore(
    item.Per || 0,
    item.Pbr || 0,
    item.Roe || 0
  );

  // Build signals
  if ((item.OneWeek || 0) > 0.03) signals.push(`📈 Naik ${((item.OneWeek || 0) * 100).toFixed(1)}% minggu ini`);
  if ((item.OneMonth || 0) > 0.05) signals.push(`📊 Momentum positif 1 bulan`);
  if (breakoutScore >= 85) signals.push(`🚀 Mendekati level tertinggi tahunan`);
  if (breakoutScore >= 70 && breakoutScore < 85) signals.push(`⬆️ Posisi kuat di rentang tahunan`);
  if (volumeScore >= 70) signals.push(`🔥 Volume spike terdeteksi`);
  if ((item.Pbr || 0) > 0 && (item.Pbr || 0) < 1) signals.push(`💎 Undervalued (PBV < 1)`);
  if ((item.Roe || 0) * 100 > 15) signals.push(`✅ ROE kuat (${((item.Roe || 0) * 100).toFixed(1)}%)`);
  if ((item.Per || 0) > 0 && (item.Per || 0) < 15) signals.push(`🏷️ PE Murah (${(item.Per || 0).toFixed(1)}x)`);

  const totalScore = Math.round(
    momentumScore * 0.30 +
    breakoutScore * 0.25 +
    volumeScore * 0.25 +
    fundamentalScore * 0.20
  );

  return {
    momentumScore,
    breakoutScore,
    volumeScore,
    fundamentalScore,
    totalScore: Math.max(0, Math.min(100, totalScore)),
    signals,
  };
}

export function computeScalpingScore(item: RawApiStock): ScalpingScoreBreakdown {
  const signals: string[] = [];

  const dailyRange = (item.AdjustedHighPrice || item.Last) - (item.AdjustedLowPrice || item.Last);

  const volatilityScore = calcVolatilityScore(
    item.StdevOneYear || 0,
    item.BetaOneYear || 1,
    dailyRange,
    item.Last || 1
  );

  const momentumScore = calcMomentumScore(
    item.OneDay || 0,
    item.OneWeek || 0,
    item.OneMonth || 0,
    item.ThreeMonth || 0,
    'scalping'
  );

  const volumeScore = calcVolumeSpikeScore(
    item.Volume || 0,
    item.Value || 0,
    item.Capitalization || 1,
    item.Frequency || 0
  );

  // Build signals
  if ((item.StdevOneYear || 0) > 0.4) signals.push(`⚡ Volatilitas tinggi (${((item.StdevOneYear || 0) * 100).toFixed(0)}%/yr)`);
  if ((item.BetaOneYear || 0) > 1.2) signals.push(`📡 Beta tinggi (${(item.BetaOneYear || 0).toFixed(2)})`);
  if ((item.OneDay || 0) > 0.02) signals.push(`🔥 Naik ${((item.OneDay || 0) * 100).toFixed(2)}% hari ini`);
  if ((item.Frequency || 0) > 5000) signals.push(`💹 Frekuensi tinggi (${((item.Frequency || 0) / 1000).toFixed(1)}K transaksi)`);
  if (volumeScore >= 65) signals.push(`📊 Volume aktif`);
  const rangePct = item.Last > 0 ? (dailyRange / item.Last) * 100 : 0;
  if (rangePct > 3) signals.push(`📏 Range harian lebar (${rangePct.toFixed(1)}%)`);

  const totalScore = Math.round(
    volatilityScore * 0.35 +
    momentumScore * 0.35 +
    volumeScore * 0.30
  );

  return {
    volatilityScore,
    momentumScore,
    volumeScore,
    totalScore: Math.max(0, Math.min(100, totalScore)),
    signals,
  };
}

export function computeRecommendation(
  swingScore: number,
  scalpingScore: number,
  per: number,
  pbv: number,
  roe: number
): { rec: 'BUY' | 'ACCUMULATE' | 'HOLD' | 'SELL' | 'REDUCE' | 'NEUTRAL'; strategy: 'Momentum' | 'Reversal' | 'Breakout' | 'Consolidation' } {
  let rec: 'BUY' | 'ACCUMULATE' | 'HOLD' | 'SELL' | 'REDUCE' | 'NEUTRAL' = 'HOLD';
  let strategy: 'Momentum' | 'Reversal' | 'Breakout' | 'Consolidation' = 'Consolidation';

  if (swingScore >= 70) {
    rec = 'BUY';
    strategy = 'Breakout';
  } else if (swingScore >= 55) {
    rec = 'ACCUMULATE';
    strategy = 'Momentum';
  } else if (swingScore >= 35) {
    rec = 'HOLD';
    strategy = 'Consolidation';
  } else if (per > 0 && pbv > 0 && pbv < 1.2 && roe > 0) {
    rec = 'ACCUMULATE';
    strategy = 'Reversal';
  } else {
    rec = 'HOLD';
    strategy = 'Consolidation';
  }

  return { rec, strategy };
}

export { calcTradingLevels, estimateRSI, estimateEMARatio, estimateMACD };
