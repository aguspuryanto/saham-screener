import { OHLCVBar } from '../models/History';
import { candleAnatomy } from '../indicators/priceStructure';

export interface PatternMatch {
  id: string;
  label: string;
  bullish: boolean;
}

const DOJI_BODY_THRESHOLD = 8; // bodyPct below this = doji
const LONG_SHADOW_MULT = 2; // shadow must be >= 2x body to count as "long"

function isBullish(bar: OHLCVBar): boolean {
  return bar.close > bar.open;
}

function isBearish(bar: OHLCVBar): boolean {
  return bar.close < bar.open;
}

function bodySize(bar: OHLCVBar): number {
  return Math.abs(bar.close - bar.open);
}

function detectDoji(bar: OHLCVBar): boolean {
  const { bodyPct } = candleAnatomy(bar);
  return bodyPct <= DOJI_BODY_THRESHOLD;
}

function detectHammer(bar: OHLCVBar): boolean {
  const { lowerShadowPct, upperShadowPct } = candleAnatomy(bar);
  const body = bodySize(bar);
  const range = bar.high - bar.low;
  if (range === 0 || body === 0) return false;
  const lowerShadow = Math.min(bar.open, bar.close) - bar.low;
  return lowerShadow >= body * LONG_SHADOW_MULT && upperShadowPct <= 10 && lowerShadowPct >= 40;
}

function detectShootingStar(bar: OHLCVBar): boolean {
  const { upperShadowPct, lowerShadowPct } = candleAnatomy(bar);
  const body = bodySize(bar);
  const range = bar.high - bar.low;
  if (range === 0 || body === 0) return false;
  const upperShadow = bar.high - Math.max(bar.open, bar.close);
  return upperShadow >= body * LONG_SHADOW_MULT && lowerShadowPct <= 10 && upperShadowPct >= 40;
}

function detectBullishEngulfing(prev: OHLCVBar, curr: OHLCVBar): boolean {
  return (
    isBearish(prev) &&
    isBullish(curr) &&
    curr.open <= prev.close &&
    curr.close >= prev.open
  );
}

function detectBearishEngulfing(prev: OHLCVBar, curr: OHLCVBar): boolean {
  return (
    isBullish(prev) &&
    isBearish(curr) &&
    curr.open >= prev.close &&
    curr.close <= prev.open
  );
}

function detectMorningStar(first: OHLCVBar, second: OHLCVBar, third: OHLCVBar): boolean {
  const firstBodyPct = candleAnatomy(first).bodyPct;
  const secondBodyPct = candleAnatomy(second).bodyPct;
  const firstMidpoint = (first.open + first.close) / 2;

  return (
    isBearish(first) &&
    firstBodyPct >= 50 &&
    secondBodyPct <= 30 &&
    Math.max(second.open, second.close) < first.close &&
    isBullish(third) &&
    third.close > firstMidpoint
  );
}

function detectInsideBar(prev: OHLCVBar, curr: OHLCVBar): boolean {
  return curr.high <= prev.high && curr.low >= prev.low;
}

function detectOutsideBar(prev: OHLCVBar, curr: OHLCVBar): boolean {
  return curr.high >= prev.high && curr.low <= prev.low;
}

export function detectPatterns(bars: OHLCVBar[]): PatternMatch[] {
  if (bars.length < 3) return [];

  const curr = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const beforePrev = bars[bars.length - 3];

  const matches: PatternMatch[] = [];

  if (detectDoji(curr)) matches.push({ id: 'doji', label: 'Doji', bullish: false });
  if (detectHammer(curr)) matches.push({ id: 'hammer', label: 'Hammer', bullish: true });
  if (detectShootingStar(curr)) matches.push({ id: 'shooting_star', label: 'Shooting Star', bullish: false });
  if (detectBullishEngulfing(prev, curr))
    matches.push({ id: 'bullish_engulfing', label: 'Bullish Engulfing', bullish: true });
  if (detectBearishEngulfing(prev, curr))
    matches.push({ id: 'bearish_engulfing', label: 'Bearish Engulfing', bullish: false });
  if (detectMorningStar(beforePrev, prev, curr))
    matches.push({ id: 'morning_star', label: 'Morning Star', bullish: true });
  if (detectInsideBar(prev, curr)) matches.push({ id: 'inside_bar', label: 'Inside Bar', bullish: false });
  if (detectOutsideBar(prev, curr)) matches.push({ id: 'outside_bar', label: 'Outside Bar', bullish: curr.close > curr.open });

  return matches;
}
