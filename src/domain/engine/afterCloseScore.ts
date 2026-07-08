import { OHLCVBar } from '../models/History';
import { Stock } from '../models/Stock';
import { computeIndicatorSnapshot, IndicatorSnapshot } from '../indicators';
import { detectPatterns, PatternMatch } from '../patterns/candlestick';

/**
 * "After Close Market" screening score — built from a trader's T+0/T+1 scalping
 * journal: profits came from early-momentum entries, losses from chasing stocks
 * that had already run too far. Meant to be computed after market close (15.30-21.00)
 * to build tomorrow's watchlist, not while the market is already moving.
 *
 * Original 10-indicator rubric (out of 100) included "Broker Summary Net Buy" at
 * weight 10, but the PasarDana EOD feed has no broker summary data. Its 10 points
 * are redistributed proportionally across the remaining 9 indicators (each scaled
 * by 100/90), so the total still sums to 100.
 */
export const AFTER_CLOSE_WEIGHTS = {
  value: 22,
  rvol: 17,
  breakout: 17,
  macd: 11,
  ema: 11,
  rsi: 11,
  candlestick: 6,
  sektor: 3,
  riskReward: 2,
} as const;

export type AfterCloseCriterionKey = keyof typeof AFTER_CLOSE_WEIGHTS;

export interface AfterCloseCriterion {
  key: AfterCloseCriterionKey;
  label: string;
  weight: number;
  score: number;
  passed: boolean;
  detail: string;
}

export interface AfterCloseGate {
  label: string;
  passed: boolean;
  detail: string;
}

export interface AfterCloseScoreResult {
  total: number;
  maxTotal: number;
  eligible: boolean; // total >= WATCHLIST_THRESHOLD
  criteria: AfterCloseCriterion[];
  gates: AfterCloseGate[]; // hard AND-formula from the trading journal
  gatesPassed: boolean;
  barsUsed: number;
}

export const WATCHLIST_THRESHOLD = 85;

function scoreValue(value: number) {
  const w = AFTER_CLOSE_WEIGHTS.value;
  if (value >= 100_000_000_000) return { score: w, detail: 'Prioritas tinggi (>= Rp100 miliar)' };
  if (value >= 50_000_000_000) return { score: Math.round(w * 0.85), detail: 'Sangat baik (>= Rp50 miliar)' };
  if (value >= 20_000_000_000) return { score: Math.round(w * 0.6), detail: 'Lolos ambang minimum (>= Rp20 miliar)' };
  return { score: 0, detail: 'Di bawah Rp20 miliar, likuiditas kurang' };
}

function scoreRvol(rvol: number) {
  const w = AFTER_CLOSE_WEIGHTS.rvol;
  if (!Number.isFinite(rvol)) return { score: 0, detail: 'Data volume historis tidak cukup' };
  if (rvol >= 3) return { score: w, detail: `RVOL ${rvol.toFixed(2)}x — sangat menarik` };
  if (rvol >= 2) return { score: Math.round(w * 0.8), detail: `RVOL ${rvol.toFixed(2)}x — memenuhi syarat (>=2x)` };
  if (rvol >= 1.5) return { score: Math.round(w * 0.4), detail: `RVOL ${rvol.toFixed(2)}x — mendekati, belum 2x` };
  return { score: 0, detail: `RVOL ${rvol.toFixed(2)}x — volume belum aktif` };
}

function scoreBreakout(lastClose: number, resistance: number) {
  const w = AFTER_CLOSE_WEIGHTS.breakout;
  if (!Number.isFinite(resistance) || resistance <= 0) return { score: 0, detail: 'Resistance belum terbentuk' };
  const resistanceLabel = `Rp${Math.round(resistance).toLocaleString('id-ID')}`;
  if (lastClose >= resistance) return { score: w, detail: `Close di atas resistance (${resistanceLabel})` };
  if (lastClose / resistance >= 0.98) return { score: Math.round(w * 0.5), detail: `Mendekati resistance (${resistanceLabel}), belum breakout` };
  return { score: 0, detail: `Masih di bawah resistance (${resistanceLabel})` };
}

function scoreMacd(snapshot: IndicatorSnapshot) {
  const w = AFTER_CLOSE_WEIGHTS.macd;
  const bullish = snapshot.macd > snapshot.macdSignal;
  const prevHistogram = snapshot.prevMacd - snapshot.prevMacdSignal;
  const histogramGrowing = snapshot.macdHistogram > prevHistogram;
  if (bullish && histogramGrowing) return { score: w, detail: 'Bullish crossover, histogram membesar' };
  if (bullish) return { score: Math.round(w * 0.5), detail: 'Bullish tapi histogram mengecil, waspada' };
  return { score: 0, detail: 'MACD masih bearish' };
}

function scoreEma(snapshot: IndicatorSnapshot) {
  const w = AFTER_CLOSE_WEIGHTS.ema;
  if (snapshot.ema5 > snapshot.ema20 && snapshot.ema20 > snapshot.ema50) {
    return { score: w, detail: 'EMA5 > EMA20 > EMA50 (stack bullish penuh)' };
  }
  if (snapshot.ema20 > snapshot.ema50) {
    return { score: Math.round(w * 0.5), detail: 'EMA20 > EMA50, tapi EMA5 belum menyusul' };
  }
  return { score: 0, detail: 'Belum golden cross' };
}

function scoreRsi(rsi: number) {
  const w = AFTER_CLOSE_WEIGHTS.rsi;
  if (rsi >= 90) return { score: 0, detail: `RSI ${rsi} — hindari entry baru (>90)` };
  if (rsi > 85) return { score: Math.round(w * 0.3), detail: `RSI ${rsi} — mulai jenuh beli` };
  if (rsi >= 75) return { score: Math.round(w * 0.7), detail: `RSI ${rsi} — masih boleh (75-85)` };
  if (rsi >= 60) return { score: w, detail: `RSI ${rsi} — ideal (60-75)` };
  if (rsi >= 50) return { score: Math.round(w * 0.4), detail: `RSI ${rsi} — mulai menarik (50-60)` };
  return { score: 0, detail: `RSI ${rsi} — belum ada momentum (<50)` };
}

function scoreCandlestick(patterns: PatternMatch[]) {
  const w = AFTER_CLOSE_WEIGHTS.candlestick;
  const bullish = patterns.filter((p) => p.bullish);
  const bearish = patterns.filter((p) => !p.bullish);
  if (bullish.length > 0 && bearish.length === 0) {
    return { score: w, detail: `Pola bullish: ${bullish.map((p) => p.label).join(', ')}` };
  }
  if (bearish.length > 0) {
    return { score: 0, detail: `Pola waspada: ${bearish.map((p) => p.label).join(', ')}` };
  }
  return { score: Math.round(w * 0.5), detail: 'Tidak ada pola candlestick signifikan' };
}

function scoreSektor(stock: Stock, sectorPeers: Stock[]) {
  const w = AFTER_CLOSE_WEIGHTS.sektor;
  const sectorKey = stock.newSectorName || stock.sector;
  const peers = sectorPeers.filter((p) => p.id !== stock.id && (p.newSectorName || p.sector) === sectorKey);
  if (peers.length === 0) return { score: Math.round(w * 0.5), detail: 'Data peer sektor tidak cukup' };

  const avgChange = peers.reduce((sum, p) => sum + p.percentChange, 0) / peers.length;
  if (avgChange > 1) return { score: w, detail: `Sektor aktif, rata-rata peer +${avgChange.toFixed(1)}%` };
  if (avgChange > -1) return { score: Math.round(w * 0.5), detail: `Sektor netral, rata-rata peer ${avgChange.toFixed(1)}%` };
  return { score: 0, detail: `Sektor lemah, rata-rata peer ${avgChange.toFixed(1)}%` };
}

function scoreRiskReward(riskRewardRatio: number) {
  const w = AFTER_CLOSE_WEIGHTS.riskReward;
  if (riskRewardRatio >= 2) return { score: w, detail: `Risk:Reward 1:${riskRewardRatio.toFixed(1)}` };
  if (riskRewardRatio >= 1.5) return { score: Math.round(w * 0.5), detail: `Risk:Reward 1:${riskRewardRatio.toFixed(1)}, di bawah target 1:2` };
  return { score: 0, detail: `Risk:Reward 1:${riskRewardRatio.toFixed(1)} — kurang menarik` };
}

export function computeAfterCloseScore(
  stock: Stock,
  bars: OHLCVBar[],
  sectorPeers: Stock[] = []
): AfterCloseScoreResult | null {
  const snapshot = computeIndicatorSnapshot(bars);
  if (!snapshot) return null;

  const patterns = detectPatterns(bars);
  const rsiRounded = Math.round(snapshot.rsi14);

  const value = scoreValue(stock.value);
  const rvol = scoreRvol(snapshot.relativeVolume);
  const breakout = scoreBreakout(snapshot.lastClose, snapshot.resistance);
  const macd = scoreMacd(snapshot);
  const ema = scoreEma(snapshot);
  const rsi = scoreRsi(rsiRounded);
  const candlestick = scoreCandlestick(patterns);
  const sektor = scoreSektor(stock, sectorPeers);
  const riskReward = scoreRiskReward(stock.scalpingLevels.riskRewardRatio);

  const criteria: AfterCloseCriterion[] = [
    { key: 'value', label: 'Nilai Transaksi', weight: AFTER_CLOSE_WEIGHTS.value, ...value, passed: value.score >= AFTER_CLOSE_WEIGHTS.value },
    { key: 'rvol', label: 'Relative Volume (RVOL)', weight: AFTER_CLOSE_WEIGHTS.rvol, ...rvol, passed: rvol.score >= Math.round(AFTER_CLOSE_WEIGHTS.rvol * 0.8) },
    { key: 'breakout', label: 'Breakout Resistance', weight: AFTER_CLOSE_WEIGHTS.breakout, ...breakout, passed: breakout.score >= AFTER_CLOSE_WEIGHTS.breakout },
    { key: 'macd', label: 'MACD', weight: AFTER_CLOSE_WEIGHTS.macd, ...macd, passed: macd.score >= AFTER_CLOSE_WEIGHTS.macd },
    { key: 'ema', label: 'EMA Alignment', weight: AFTER_CLOSE_WEIGHTS.ema, ...ema, passed: ema.score >= AFTER_CLOSE_WEIGHTS.ema },
    { key: 'rsi', label: 'RSI', weight: AFTER_CLOSE_WEIGHTS.rsi, ...rsi, passed: rsi.score >= AFTER_CLOSE_WEIGHTS.rsi },
    { key: 'candlestick', label: 'Candlestick', weight: AFTER_CLOSE_WEIGHTS.candlestick, ...candlestick, passed: candlestick.score >= AFTER_CLOSE_WEIGHTS.candlestick },
    { key: 'sektor', label: 'Sektor', weight: AFTER_CLOSE_WEIGHTS.sektor, ...sektor, passed: sektor.score >= AFTER_CLOSE_WEIGHTS.sektor },
    { key: 'riskReward', label: 'Risk : Reward', weight: AFTER_CLOSE_WEIGHTS.riskReward, ...riskReward, passed: riskReward.score >= AFTER_CLOSE_WEIGHTS.riskReward },
  ];

  const total = Math.round(criteria.reduce((sum, c) => sum + c.score, 0));
  const eligible = total >= WATCHLIST_THRESHOLD;

  // Hard AND-formula from the trading journal (Broker Net Buy dropped — no data source available)
  const gates: AfterCloseGate[] = [
    {
      label: 'Nilai transaksi >= Rp20 miliar',
      passed: stock.value >= 20_000_000_000,
      detail: `Rp${(stock.value / 1_000_000_000).toFixed(1)} miliar`,
    },
    {
      label: 'RVOL >= 2x',
      passed: Number.isFinite(snapshot.relativeVolume) && snapshot.relativeVolume >= 2,
      detail: Number.isFinite(snapshot.relativeVolume) ? `${snapshot.relativeVolume.toFixed(2)}x` : '-',
    },
    {
      label: 'MACD Bullish',
      passed: snapshot.macd > snapshot.macdSignal,
      detail: snapshot.macd > snapshot.macdSignal ? 'Bullish' : 'Bearish',
    },
    {
      label: 'EMA Golden (EMA5 > EMA20 > EMA50)',
      passed: snapshot.ema5 > snapshot.ema20 && snapshot.ema20 > snapshot.ema50,
      detail: snapshot.ema5 > snapshot.ema20 && snapshot.ema20 > snapshot.ema50 ? 'Golden' : 'Belum golden',
    },
    {
      label: 'RSI 60-80',
      passed: snapshot.rsi14 >= 60 && snapshot.rsi14 <= 80,
      detail: `RSI ${rsiRounded}`,
    },
    {
      label: 'Kenaikan 1 minggu <= 15%',
      passed: stock.oneWeek <= 15,
      detail: `${stock.oneWeek.toFixed(1)}%`,
    },
    {
      label: 'Breakout Resistance',
      passed: snapshot.lastClose >= snapshot.resistance,
      detail: Number.isFinite(snapshot.resistance) ? `Resistance Rp${Math.round(snapshot.resistance).toLocaleString('id-ID')}` : '-',
    },
    {
      label: 'Risk:Reward >= 1:2',
      passed: stock.scalpingLevels.riskRewardRatio >= 2,
      detail: `1:${stock.scalpingLevels.riskRewardRatio.toFixed(1)}`,
    },
  ];
  const gatesPassed = gates.every((g) => g.passed);

  return { total, maxTotal: 100, eligible, criteria, gates, gatesPassed, barsUsed: bars.length };
}
