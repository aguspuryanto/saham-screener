import { OHLCVBar } from '../models/History';
import { closes, stdev } from './movingAverages';
import { findSwingHighs, findSwingLows } from './priceStructure';

/**
 * Best-effort heuristic detectors for chart structure — NOT rigorous chart-pattern
 * recognition (no curve-fitting, no ML). Each function answers a narrow, cheaply
 * checkable question ("is the last N bars tight and flat?") that the Structure
 * layer in the Watchlist Engine turns into points.
 */

export function tightConsolidation(bars: OHLCVBar[], lookback = 10): boolean {
  const tail = bars.slice(-lookback);
  if (tail.length < lookback) return false;
  const tailCloses = closes(tail);
  const mean = tailCloses.reduce((s, c) => s + c, 0) / tailCloses.length;
  if (mean <= 0) return false;
  const sd = stdev(tailCloses, tailCloses.length);
  const sdPct = (sd[sd.length - 1] / mean) * 100;
  return Number.isFinite(sdPct) && sdPct < 3;
}

export function baseFormation(bars: OHLCVBar[], lookback = 15): boolean {
  const tail = bars.slice(-lookback);
  if (tail.length < lookback) return false;
  const highs = tail.map((b) => b.high);
  const lows = tail.map((b) => b.low);
  const mean = closes(tail).reduce((s, c) => s + c, 0) / tail.length;
  if (mean <= 0) return false;
  const rangePct = ((Math.max(...highs) - Math.min(...lows)) / mean) * 100;
  return rangePct < 8;
}

export function ascendingTriangleish(bars: OHLCVBar[], lookback = 40): boolean {
  const tail = bars.slice(-lookback);
  const swingHighs = findSwingHighs(tail);
  const swingLows = findSwingLows(tail);
  if (swingHighs.length < 2 || swingLows.length < 2) return false;

  const lastTwoHighs = swingHighs.slice(-2);
  const flatResistance =
    Math.abs(lastTwoHighs[1].high - lastTwoHighs[0].high) / lastTwoHighs[0].high < 0.02;

  const lastTwoLows = swingLows.slice(-2);
  const risingLows = lastTwoLows[1].low > lastTwoLows[0].low;

  return flatResistance && risingLows;
}

export function flagPennantish(bars: OHLCVBar[], impulseLookback = 8, consolidationLookback = 4): boolean {
  const total = impulseLookback + consolidationLookback;
  if (bars.length < total) return false;

  const impulse = bars.slice(-total, -consolidationLookback);
  const consolidation = bars.slice(-consolidationLookback);

  const impulseStart = impulse[0].open;
  const impulseEnd = impulse[impulse.length - 1].close;
  if (impulseStart <= 0) return false;
  const impulseGainPct = ((impulseEnd - impulseStart) / impulseStart) * 100;
  if (impulseGainPct < 10) return false;

  const consolidationCloses = closes(consolidation);
  const mean = consolidationCloses.reduce((s, c) => s + c, 0) / consolidationCloses.length;
  if (mean <= 0) return false;
  const highs = consolidation.map((b) => b.high);
  const lows = consolidation.map((b) => b.low);
  const rangePct = ((Math.max(...highs) - Math.min(...lows)) / mean) * 100;

  return rangePct < 6;
}
