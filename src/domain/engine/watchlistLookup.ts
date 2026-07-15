import { WatchlistOutput } from '../models/Watchlist';
import { computeWatchlistOutput } from './watchlistEngine';
import { stockRepository } from '../../data/repositories/StockRepository';
import { fetchStockHistory } from '../../data/repositories/HistoryRepository';

export async function computeHistoricalWatchlistScore(
  ticker: string,
  asOfDate: string
): Promise<WatchlistOutput | null> {
  const stock = await stockRepository.getStockById(ticker);
  if (!stock) return null;

  const history = await fetchStockHistory(ticker);
  if (!history.ok) return null;

  const bars = history.bars.filter((bar) => bar.date <= asOfDate);
  if (bars.length === 0) return null;

  return computeWatchlistOutput(stock, bars);
}
