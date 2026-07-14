import { OHLCVBar } from '../models/History';
import { Stock } from '../models/Stock';
import { computeIndicatorSnapshot } from '../indicators';
import { WatchlistOutput, WatchlistTier } from '../models/Watchlist';
import { computeLiquidityScore, computeSmartMoneyScore } from './scores';
import { computeWatchlistMomentumScore } from './watchlistMomentum';
import { computeStructureScore } from './watchlistStructure';
import { computeWatchlistPenalties, computeWatchlistRiskCategory } from './watchlistRisk';
import { clamp } from './utils';

const CATEGORY_WEIGHTS = {
  momentum: 0.3,
  liquidity: 0.25,
  smartMoney: 0.2,
  structure: 0.15,
  risk: 0.1,
} as const;

function tierFromScore(score: number): WatchlistTier {
  if (score >= 90) return 'ELITE';
  if (score >= 80) return 'VERY_GOOD';
  if (score >= 70) return 'WORTH_WATCHING';
  return 'NO_TRADE';
}

const TIER_LABEL: Record<WatchlistTier, string> = {
  ELITE: 'Elite Watchlist',
  VERY_GOOD: 'Very Good',
  WORTH_WATCHING: 'Worth Watching',
  NO_TRADE: 'No Trade',
};

/**
 * Stage 1 — After Market AI. Screens for stocks worth *watching* tomorrow, not
 * stocks that are "going to go up". Never emits BUY/SELL — see the module doc
 * on `domain/engine/watchlistRisk.ts` and the Gen-2 pipeline plan: that call
 * requires live opening-auction data (Stage 2) this app doesn't have yet.
 *
 * Liquidity (Spread/Tick-Frequency) and Smart Money (Broker Accumulation/
 * Foreign Flow/Delivery Ratio) are proxied from RVOL, turnover, and
 * close-position only — the underlying broker/auction feeds don't exist in
 * this codebase (see `domain/engine/afterCloseScore.ts` for the same
 * documented limitation).
 */
export function computeWatchlistOutput(stock: Stock, bars: OHLCVBar[]): WatchlistOutput | null {
  const snapshot = computeIndicatorSnapshot(bars);
  if (!snapshot) return null;

  const momentum = computeWatchlistMomentumScore(snapshot);
  const structure = computeStructureScore(snapshot, bars);
  const liquidity = computeLiquidityScore(snapshot, stock);
  const smartMoney = computeSmartMoneyScore(snapshot);
  const risk = computeWatchlistRiskCategory(snapshot);
  const penalties = computeWatchlistPenalties(snapshot, bars);

  const categories = { momentum: momentum.score, liquidity, smartMoney, structure: structure.score, risk };

  const compositeRaw =
    categories.momentum * CATEGORY_WEIGHTS.momentum +
    categories.liquidity * CATEGORY_WEIGHTS.liquidity +
    categories.smartMoney * CATEGORY_WEIGHTS.smartMoney +
    categories.structure * CATEGORY_WEIGHTS.structure +
    categories.risk * CATEGORY_WEIGHTS.risk;

  const totalPenalty = penalties.reduce((sum, p) => sum + p.points, 0);
  const finalScore = Math.round(clamp(compositeRaw - totalPenalty, 0, 100));
  const tier = tierFromScore(finalScore);

  const reasons: string[] = [
    `Skor akhir ${finalScore}/100 -> ${TIER_LABEL[tier]}.`,
    ...momentum.detail.map((d) => `[Momentum] ${d}`),
    ...structure.detail.map((d) => `[Structure] ${d}`),
    `[Liquidity] Skor ${liquidity}/100`,
    `[Smart Money] Skor ${smartMoney}/100 (proxy dari RVOL & posisi close, tanpa data broker/foreign flow riil)`,
    `[Risk] Skor kategori ${risk}/100`,
  ];
  if (penalties.length > 0) {
    reasons.push(...penalties.map((p) => `[Penalty -${p.points}] ${p.label} — ${p.detail}`));
  } else {
    reasons.push('Tidak ada penalty risiko yang terpicu');
  }

  return {
    ticker: stock.ticker,
    finalScore,
    tier,
    categories,
    penalties,
    reasons,
    dataAvailable: true,
    barsUsed: bars.length,
  };
}
