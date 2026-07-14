import { WatchlistPenalty } from '../engine/watchlistRisk';

export type WatchlistTier = 'ELITE' | 'VERY_GOOD' | 'WORTH_WATCHING' | 'NO_TRADE';

export interface WatchlistCategoryScores {
  momentum: number;
  liquidity: number;
  smartMoney: number;
  structure: number;
  risk: number;
}

export interface WatchlistOutput {
  ticker: string;
  finalScore: number;
  tier: WatchlistTier;
  categories: WatchlistCategoryScores;
  penalties: WatchlistPenalty[];
  reasons: string[];
  dataAvailable: boolean;
  barsUsed: number;
}
