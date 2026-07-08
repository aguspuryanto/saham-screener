import { IndicatorSnapshot } from '../indicators';
import { Stock } from '../models/Stock';

export function makeSnapshot(overrides: Partial<IndicatorSnapshot> = {}): IndicatorSnapshot {
  return {
    lastClose: 100,
    lastOpen: 99,
    lastHigh: 101,
    lastLow: 98,
    lastVolume: 1_000_000,
    prevClose: 99,

    ema5: 100,
    ema9: 100,
    ema20: 100,
    ema50: 100,
    prevEma9: 100,
    prevEma20: 100,

    ma20: 100,
    ma50: 100,

    rsi14: 50,
    prevRsi14: 50,

    macd: 0,
    macdSignal: 0,
    macdHistogram: 0,
    prevMacd: 0,
    prevMacdSignal: 0,

    atr14: 2,
    prevAtr14: 2,

    bollingerUpper: 105,
    bollingerMiddle: 100,
    bollingerLower: 95,

    stochasticK: 50,
    stochasticD: 50,

    adx14: 15,

    volumeMa20: 1_000_000,
    relativeVolume: 1,
    avgTransactionValue: 1_000_000_000,
    avgDailyRangePct: 2,

    support: 90,
    resistance: 110,
    highestHigh20: 105,
    lowestLow20: 90,
    higherHigh: false,
    higherLow: false,

    gapPct: 0,
    bodyPct: 30,
    upperShadowPct: 20,
    lowerShadowPct: 20,

    barsAvailable: 100,

    ...overrides,
  };
}

export function makeStock(overrides: Partial<Stock> = {}): Stock {
  return {
    id: 'TEST',
    ticker: 'TEST',
    name: 'Test Stock',
    sector: 'Sector',
    subSector: 'SubSector',
    newSectorName: 'Sector',
    lastClose: 100,
    prevClose: 99,
    highToday: 101,
    lowToday: 98,
    percentChange: 1,
    technical: { rsi14: 50, rsi12: 50, macd: 0, macdSignal: 0, ema20: 100, ema50: 100, volRatio: 1 },
    fundamental: { pbv: 1.5, per: 15, eps: 6.5, dy: 0, roe: 12 },
    dcf: { intrinsicValue: 100, status: 'Fair Value' },
    consensus: { rating: 'Hold', analystsCount: 0, averageRating: 3 },
    recommendation: 'HOLD',
    strategy: 'Consolidation',
    lastUpdated: '2026-01-01',
    oneDay: 1,
    oneWeek: 2,
    oneMonth: 3,
    threeMonth: 5,
    sixMonth: 8,
    oneYear: 15,
    volume: 1_000_000,
    value: 100_000_000_000,
    frequency: 5000,
    capitalization: 1_000_000_000_000,
    annualHigh: 120,
    annualLow: 80,
    beta: 1,
    stdev: 0.3,
    freeFloatPct: 30,
    swingScore: { momentumScore: 50, breakoutScore: 50, volumeScore: 50, fundamentalScore: 50, totalScore: 50, signals: [] },
    scalpingScore: { volatilityScore: 50, momentumScore: 50, volumeScore: 50, totalScore: 50, signals: [] },
    swingLevels: { entry: 100, target1: 105, target2: 110, stopLoss: 95, riskRewardRatio: 2 },
    scalpingLevels: { entry: 100, target1: 102, target2: 104, stopLoss: 98, riskRewardRatio: 1.5 },
    ...overrides,
  };
}
