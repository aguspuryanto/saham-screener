import { OHLCVBar } from '../models/History';

export function highestHigh(bars: OHLCVBar[], period = 20): number {
  const tail = bars.slice(-period);
  if (tail.length === 0) return NaN;
  return Math.max(...tail.map((b) => b.high));
}

export function lowestLow(bars: OHLCVBar[], period = 20): number {
  const tail = bars.slice(-period);
  if (tail.length === 0) return NaN;
  return Math.min(...tail.map((b) => b.low));
}

/** Swing high: a bar whose high is >= the high of `wing` bars on each side. */
export function findSwingHighs(bars: OHLCVBar[], wing = 2): { index: number; high: number }[] {
  const swings: { index: number; high: number }[] = [];
  for (let i = wing; i < bars.length - wing; i++) {
    const isSwing = Array.from({ length: wing }, (_, k) => k + 1).every(
      (k) => bars[i].high >= bars[i - k].high && bars[i].high >= bars[i + k].high
    );
    if (isSwing) swings.push({ index: i, high: bars[i].high });
  }
  return swings;
}

export function findSwingLows(bars: OHLCVBar[], wing = 2): { index: number; low: number }[] {
  const swings: { index: number; low: number }[] = [];
  for (let i = wing; i < bars.length - wing; i++) {
    const isSwing = Array.from({ length: wing }, (_, k) => k + 1).every(
      (k) => bars[i].low <= bars[i - k].low && bars[i].low <= bars[i + k].low
    );
    if (isSwing) swings.push({ index: i, low: bars[i].low });
  }
  return swings;
}

/** Support/Resistance from recent swing points (wider lookback than the raw 20-bar high/low). */
export function supportResistance(bars: OHLCVBar[], lookback = 60): { support: number; resistance: number } {
  const tail = bars.slice(-lookback);
  const swingHighs = findSwingHighs(tail);
  const swingLows = findSwingLows(tail);

  const resistance = swingHighs.length > 0 ? Math.max(...swingHighs.map((s) => s.high)) : highestHigh(bars, lookback);
  const support = swingLows.length > 0 ? Math.min(...swingLows.map((s) => s.low)) : lowestLow(bars, lookback);

  return { support, resistance };
}

/** Compares the last two swing highs / lows to detect a Higher High / Higher Low sequence. */
export function higherHighLower(bars: OHLCVBar[], lookback = 60): { higherHigh: boolean; higherLow: boolean } {
  const tail = bars.slice(-lookback);
  const swingHighs = findSwingHighs(tail);
  const swingLows = findSwingLows(tail);

  const higherHigh =
    swingHighs.length >= 2 && swingHighs[swingHighs.length - 1].high > swingHighs[swingHighs.length - 2].high;
  const higherLow =
    swingLows.length >= 2 && swingLows[swingLows.length - 1].low > swingLows[swingLows.length - 2].low;

  return { higherHigh, higherLow };
}

export function gapPct(bars: OHLCVBar[]): number {
  if (bars.length < 2) return 0;
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  if (prev.close === 0) return 0;
  return ((last.open - prev.close) / prev.close) * 100;
}

export function candleAnatomy(bar: OHLCVBar): { bodyPct: number; upperShadowPct: number; lowerShadowPct: number } {
  const range = bar.high - bar.low;
  if (range === 0) return { bodyPct: 0, upperShadowPct: 0, lowerShadowPct: 0 };

  const bodyPct = (Math.abs(bar.close - bar.open) / range) * 100;
  const upperShadowPct = ((bar.high - Math.max(bar.open, bar.close)) / range) * 100;
  const lowerShadowPct = ((Math.min(bar.open, bar.close) - bar.low) / range) * 100;

  return { bodyPct, upperShadowPct, lowerShadowPct };
}
