import { OHLCVBar } from '../models/History';
import { IndicatorSnapshot } from '../indicators';
import { clamp } from './utils';

export interface RiskScoreResult {
  score: number; // 100 = safe, 0 = dangerous / overextended
  detail: string[];
}

/**
 * Safety layer — the piece the old engines were missing. Every bullish momentum
 * signal (RVOL, EMA golden, MACD bullish) can coexist with a dangerously
 * overextended entry (big gap, RSI near exhaustion, price far above EMA20 in ATR
 * terms, no room left to resistance). This scores that danger independently so it
 * can drag the composite down even when momentum looks perfect.
 */
export function computeRiskScore(snapshot: IndicatorSnapshot, bars: OHLCVBar[]): RiskScoreResult {
  const detail: string[] = [];
  let penalty = 0;

  const gap = snapshot.gapPct;
  if (gap > 25) {
    penalty += 35;
    detail.push(`Gap up ekstrem ${gap.toFixed(1)}% — jangan kejar (>25%)`);
  } else if (gap > 15) {
    penalty += 22;
    detail.push(`Gap up tinggi ${gap.toFixed(1)}% — risiko tinggi (15-25%)`);
  } else if (gap > 8) {
    penalty += 12;
    detail.push(`Gap up ${gap.toFixed(1)}% — kurangi probabilitas (8-15%)`);
  } else if (gap > 3) {
    penalty += 5;
    detail.push(`Gap up ${gap.toFixed(1)}% — waspada (3-8%)`);
  }

  const rsi = snapshot.rsi14;
  if (rsi > 90) {
    penalty += 30;
    detail.push(`RSI ${rsi.toFixed(0)} — risiko sangat tinggi (>90)`);
  } else if (rsi > 85) {
    penalty += 20;
    detail.push(`RSI ${rsi.toFixed(0)} — kurangi skor (>85)`);
  } else if (rsi > 80) {
    penalty += 10;
    detail.push(`RSI ${rsi.toFixed(0)} — mulai jenuh beli (80-85)`);
  } else if (rsi > 70) {
    penalty += 5;
    detail.push(`RSI ${rsi.toFixed(0)} — masih baik tapi diawasi (70-80)`);
  }

  const atr = snapshot.atr14 > 0 ? snapshot.atr14 : snapshot.lastClose * 0.01;
  const atrExtension = (snapshot.lastClose - snapshot.ema20) / atr;
  if (atrExtension > 5) {
    penalty += 25;
    detail.push(`Harga >5x ATR di atas EMA20 — sangat overextended`);
  } else if (atrExtension > 3) {
    penalty += 12;
    detail.push(`Harga >3x ATR di atas EMA20 — overextended`);
  }

  if (Number.isFinite(snapshot.resistance) && snapshot.resistance > 0) {
    const roomPct = ((snapshot.resistance - snapshot.lastClose) / snapshot.lastClose) * 100;
    if (roomPct < 1) {
      penalty += 12;
      detail.push('Hampir tidak ada ruang ke resistance (<1%)');
    } else if (roomPct < 2) {
      penalty += 6;
      detail.push('Ruang ke resistance sempit (<2%)');
    }
  }

  if (snapshot.lastClose > snapshot.bollingerUpper && snapshot.bollingerUpper > 0) {
    penalty += 10;
    detail.push('Close di atas Bollinger Band atas — statistically overextended');
  }

  const lastThree = bars.slice(-3);
  if (lastThree.length === 3) {
    const allGreen = lastThree.every((b) => b.close > b.open);
    const cumGainPct =
      lastThree[0].open > 0 ? ((lastThree[2].close - lastThree[0].open) / lastThree[0].open) * 100 : 0;
    if (allGreen && cumGainPct > 15) {
      penalty += 15;
      detail.push(`Kenaikan parabolik ${cumGainPct.toFixed(1)}% dalam 3 hari — rawan koreksi tajam`);
    }
  }

  const score = Math.round(clamp(100 - penalty, 0, 100));
  if (detail.length === 0) detail.push('Tidak ada sinyal overextension signifikan');

  return { score, detail };
}
