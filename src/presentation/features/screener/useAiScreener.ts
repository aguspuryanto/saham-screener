import { useCallback, useRef, useState } from 'react';
import { Stock } from '../../../domain/models/Stock';
import { OHLCVBar } from '../../../domain/models/History';
import { AiEngineOutput } from '../../../domain/models/AiEngine';
import { fetchStockHistory } from '../../../data/repositories/HistoryRepository';
import { computeAiEngineOutput } from '../../../domain/engine/aiEngine';

export type AiScreenerStatus = 'idle' | 'loading' | 'ok' | 'no-history' | 'insufficient-bars';

interface HistoryCacheEntry {
  ok: boolean;
  bars: OHLCVBar[];
}

const historyCache = new Map<string, HistoryCacheEntry>();

const CONCURRENCY_LIMIT = 5;

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

export function useAiScreener() {
  const [results, setResults] = useState<Map<string, AiEngineOutput | null>>(new Map());
  const [statusByTicker, setStatusByTicker] = useState<Map<string, AiScreenerStatus>>(new Map());
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const runIdRef = useRef(0);

  const run = useCallback(async (stocks: Stock[]) => {
    const runId = ++runIdRef.current;
    setIsRunning(true);
    setProgress({ done: 0, total: stocks.length });

    setStatusByTicker((prev) => {
      const next = new Map(prev);
      stocks.forEach((s) => {
        if (!next.has(s.ticker)) next.set(s.ticker, 'idle');
      });
      return next;
    });

    let done = 0;

    await runWithConcurrency(stocks, CONCURRENCY_LIMIT, async (stock) => {
      if (runIdRef.current !== runId) return;

      setStatusByTicker((prev) => new Map(prev).set(stock.ticker, 'loading'));

      let entry = historyCache.get(stock.ticker);
      if (!entry) {
        const res = await fetchStockHistory(stock.ticker);
        entry = { ok: res.ok, bars: res.bars };
        historyCache.set(stock.ticker, entry);
      }

      if (runIdRef.current !== runId) return;

      if (!entry.ok || entry.bars.length === 0) {
        setStatusByTicker((prev) => new Map(prev).set(stock.ticker, 'no-history'));
        setResults((prev) => new Map(prev).set(stock.ticker, null));
      } else {
        const output = computeAiEngineOutput(stock, entry.bars);
        setStatusByTicker((prev) =>
          new Map(prev).set(stock.ticker, output ? 'ok' : 'insufficient-bars')
        );
        setResults((prev) => new Map(prev).set(stock.ticker, output));
      }

      done += 1;
      if (runIdRef.current === runId) {
        setProgress({ done, total: stocks.length });
      }
    });

    if (runIdRef.current === runId) {
      setIsRunning(false);
    }
  }, []);

  return { results, statusByTicker, progress, isRunning, run };
}
