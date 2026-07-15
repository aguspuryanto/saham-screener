export interface TradeJournalEntry {
  id?: number;
  ticker: string;
  loggedAt?: string;
  entryDate?: string | null;
  exitDate?: string | null;
  watchlistScore?: number | null;
  watchlistTier?: string | null;
  entryPrice?: number | null;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  resultPct?: number | null;
  maxDrawdownPct?: number | null;
  maxProfitIntradayPct?: number | null;
  entryReason?: string | null;
  exitReason?: string | null;
}
