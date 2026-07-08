import { useEffect, useState } from 'react';
import { OHLCVBar } from '../../../domain/models/History';
import { fetchStockHistory } from '../../../data/repositories/HistoryRepository';

interface StockHistoryState {
  loading: boolean;
  ok: boolean;
  bars: OHLCVBar[];
}

const sessionCache = new Map<string, { ok: boolean; bars: OHLCVBar[] }>();

export function useStockHistory(ticker: string): StockHistoryState {
  const cached = sessionCache.get(ticker);
  const [state, setState] = useState<StockHistoryState>(
    cached ? { loading: false, ...cached } : { loading: true, ok: false, bars: [] }
  );

  useEffect(() => {
    let cancelled = false;
    const existing = sessionCache.get(ticker);

    if (existing) {
      setState({ loading: false, ...existing });
      return;
    }

    setState({ loading: true, ok: false, bars: [] });

    fetchStockHistory(ticker).then((res) => {
      if (cancelled) return;
      const result = { ok: res.ok, bars: res.bars };
      sessionCache.set(ticker, result);
      setState({ loading: false, ...result });
    });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  return state;
}
