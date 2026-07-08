import { OHLCVBar } from '../models/History';
import { ema, sma, closes, lastValid, valueAt } from './movingAverages';
import { rsi } from './rsi';
import { macd } from './macd';
import { atr } from './atr';
import { bollingerBands } from './bollinger';
import { stochastic } from './stochastic';
import { adx } from './adx';
import { volumeMA20, relativeVolume, avgTransactionValue, avgDailyRangePct } from './volume';
import { supportResistance, higherHighLower, highestHigh, lowestLow, gapPct, candleAnatomy } from './priceStructure';

export interface IndicatorSnapshot {
  lastClose: number;
  lastOpen: number;
  lastHigh: number;
  lastLow: number;
  lastVolume: number;
  prevClose: number;

  ema5: number;
  ema9: number;
  ema20: number;
  ema50: number;
  prevEma9: number;
  prevEma20: number;

  ma20: number;
  ma50: number;

  rsi14: number;
  prevRsi14: number;

  macd: number;
  macdSignal: number;
  macdHistogram: number;
  prevMacd: number;
  prevMacdSignal: number;

  atr14: number;
  prevAtr14: number;

  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;

  stochasticK: number;
  stochasticD: number;

  adx14: number;

  volumeMa20: number;
  relativeVolume: number;
  avgTransactionValue: number;
  avgDailyRangePct: number;

  support: number;
  resistance: number;
  highestHigh20: number;
  lowestLow20: number;
  higherHigh: boolean;
  higherLow: boolean;

  gapPct: number;
  bodyPct: number;
  upperShadowPct: number;
  lowerShadowPct: number;

  barsAvailable: number;
}

const MIN_BARS_REQUIRED = 60;

export function computeIndicatorSnapshot(bars: OHLCVBar[]): IndicatorSnapshot | null {
  if (bars.length < MIN_BARS_REQUIRED) return null;

  const priceCloses = closes(bars);
  const ema5Series = ema(priceCloses, 5);
  const ema9Series = ema(priceCloses, 9);
  const ema20Series = ema(priceCloses, 20);
  const ema50Series = ema(priceCloses, 50);
  const ma20Series = sma(priceCloses, 20);
  const ma50Series = sma(priceCloses, 50);
  const rsiSeries = rsi(bars, 14);
  const { macdLine, signalLine, histogram } = macd(bars);
  const atrSeries = atr(bars, 14);
  const boll = bollingerBands(bars, 20, 2);
  const stoch = stochastic(bars, 14, 3);
  const adxSeries = adx(bars, 14);

  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const { support, resistance } = supportResistance(bars);
  const { higherHigh, higherLow } = higherHighLower(bars);
  const anatomy = candleAnatomy(last);

  return {
    lastClose: last.close,
    lastOpen: last.open,
    lastHigh: last.high,
    lastLow: last.low,
    lastVolume: last.volume,
    prevClose: prev.close,

    ema5: lastValid(ema5Series),
    ema9: lastValid(ema9Series),
    ema20: lastValid(ema20Series),
    ema50: lastValid(ema50Series),
    prevEma9: valueAt(ema9Series, 1),
    prevEma20: valueAt(ema20Series, 1),

    ma20: lastValid(ma20Series),
    ma50: lastValid(ma50Series),

    rsi14: lastValid(rsiSeries),
    prevRsi14: valueAt(rsiSeries, 1),

    macd: lastValid(macdLine),
    macdSignal: lastValid(signalLine),
    macdHistogram: lastValid(histogram),
    prevMacd: valueAt(macdLine, 1),
    prevMacdSignal: valueAt(signalLine, 1),

    atr14: lastValid(atrSeries),
    prevAtr14: valueAt(atrSeries, 1),

    bollingerUpper: lastValid(boll.upper),
    bollingerMiddle: lastValid(boll.middle),
    bollingerLower: lastValid(boll.lower),

    stochasticK: lastValid(stoch.k),
    stochasticD: lastValid(stoch.d),

    adx14: lastValid(adxSeries),

    volumeMa20: volumeMA20(bars),
    relativeVolume: relativeVolume(bars),
    avgTransactionValue: avgTransactionValue(bars),
    avgDailyRangePct: avgDailyRangePct(bars),

    support,
    resistance,
    highestHigh20: highestHigh(bars, 20),
    lowestLow20: lowestLow(bars, 20),
    higherHigh,
    higherLow,

    gapPct: gapPct(bars),
    bodyPct: anatomy.bodyPct,
    upperShadowPct: anatomy.upperShadowPct,
    lowerShadowPct: anatomy.lowerShadowPct,

    barsAvailable: bars.length,
  };
}
