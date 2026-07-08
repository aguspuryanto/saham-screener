import { IndicatorSnapshot } from '../indicators';
import { PatternMatch } from '../patterns/candlestick';
import { AiScores, TrendCategory } from '../models/AiEngine';

export interface ExplanationInput {
  snapshot: IndicatorSnapshot;
  patterns: PatternMatch[];
  scores: AiScores;
  trendCategory: TrendCategory;
  ruleExplanations: string[];
}

export function buildExplanation(input: ExplanationInput): string[] {
  const { snapshot, patterns, trendCategory, ruleExplanations } = input;
  const lines: string[] = [];

  lines.push(`Trend: ${trendCategory} (ADX ${snapshot.adx14.toFixed(1)})`);
  lines.push(
    snapshot.ema9 > snapshot.ema20
      ? `EMA9 berada di atas EMA20 (bullish)`
      : `EMA9 berada di bawah EMA20 (bearish)`
  );
  lines.push(`RSI14 saat ini ${snapshot.rsi14.toFixed(0)}`);
  lines.push(
    snapshot.macd > snapshot.macdSignal
      ? `MACD berada di atas signal line (bullish)`
      : `MACD berada di bawah signal line (bearish)`
  );
  lines.push(`Volume ${snapshot.relativeVolume.toFixed(2)}x rata-rata 20 hari`);

  for (const pattern of patterns) {
    lines.push(`Pola candlestick terdeteksi: ${pattern.label}`);
  }

  for (const explanation of ruleExplanations) {
    lines.push(explanation);
  }

  lines.push('Data dividend dan foreign buy/sell tidak tersedia dari sumber data saat ini dan tidak memengaruhi skor.');

  return lines;
}
