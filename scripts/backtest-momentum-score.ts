/**
 * Backtest of the AI Engine Momentum Score (src/domain/engine/scores.ts computeMomentumScore)
 * against real historical daily bars stored in data/app.db (daily_bars table).
 *
 * Reuses the exact production indicator/scoring code — this is NOT a reimplementation —
 * so results reflect what the app itself would have signaled on each historical day.
 *
 * Run: npx tsx scripts/backtest-momentum-score.ts
 */
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { computeIndicatorSnapshot } from '../src/domain/indicators';
import { computeMomentumScore } from '../src/domain/engine/scores';
import { OHLCVBar } from '../src/domain/models/History';

const MIN_BARS_REQUIRED = 60;
const WIN_THRESHOLD_PCT = 5; // High(t+1) >= Open(t+1) * 1.05

interface Row {
  ticker: string;
  date: string;
  entryDate: string;
  sector: string | null;

  closeAtT: number;
  momentumScore: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema9: number;
  ema20: number;
  ema50: number;
  relativeVolume: number;
  higherHigh: boolean;
  higherLow: boolean;

  value: number; // proxy = close(t) * volume(t)
  gapPct: number; // (open(t+1) - close(t)) / close(t) * 100

  entry: number;

  ret_o2h_1d: number;
  ret_o2c_1d: number;
  mfe_1d: number;
  mae_1d: number;
  win: boolean;
  realizedRR_1d: number | null;

  ret_o2c_3d: number | null;
  mfe_3d: number | null;
  mae_3d: number | null;

  ret_o2c_5d: number | null;
  mfe_5d: number | null;
  mae_5d: number | null;

  falseBreakout: boolean;

  emaState: 'golden' | 'death' | 'sideways';
  macdState: 'bullish' | 'bearish' | 'flat';
}

function pctReturn(entry: number, target: number): number {
  return ((target - entry) / entry) * 100;
}

function classifyEmaState(ema20: number, ema50: number, close: number): Row['emaState'] {
  const spreadPct = Math.abs(ema20 - ema50) / close * 100;
  if (spreadPct < 0.5) return 'sideways';
  return ema20 > ema50 ? 'golden' : 'death';
}

function classifyMacdState(macd: number, signal: number, close: number): Row['macdState'] {
  const diffPct = Math.abs(macd - signal) / close * 100;
  if (diffPct < 0.02) return 'flat';
  return macd > signal ? 'bullish' : 'bearish';
}

async function fetchSectorMap(): Promise<Record<string, string> | null> {
  try {
    const response = await fetch(
      'https://pasardana.id/api/StockSearchResult/GetAll?pageBegin=0&pageLength=1000&sortField=Code&sortOrder=ASC',
      { signal: AbortSignal.timeout(15000) }
    );
    if (!response.ok) return null;
    const data: Array<{ Code: string; SectorName: string }> = await response.json();
    const map: Record<string, string> = {};
    for (const item of data) map[item.Code] = item.SectorName;
    return map;
  } catch {
    return null;
  }
}

function windowStats(bars: OHLCVBar[], entry: number, startIdx: number, endIdx: number) {
  // endIdx inclusive, both are indices into `bars`
  const window = bars.slice(startIdx, endIdx + 1);
  if (window.length === 0) return null;
  const maxHigh = Math.max(...window.map((b) => b.high));
  const minLow = Math.min(...window.map((b) => b.low));
  const exitClose = window[window.length - 1].close;
  return {
    ret: pctReturn(entry, exitClose),
    mfe: pctReturn(entry, maxHigh),
    mae: pctReturn(entry, minLow),
  };
}

function loadBars() {
  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'app.db');
  const db = new Database(dbPath, { readonly: true });

  const tickers = db.prepare('SELECT DISTINCT ticker FROM daily_bars ORDER BY ticker').all() as { ticker: string }[];

  const barsByTicker = new Map<string, OHLCVBar[]>();
  for (const { ticker } of tickers) {
    const bars = db
      .prepare('SELECT date, open, high, low, close, volume FROM daily_bars WHERE ticker = ? ORDER BY date ASC')
      .all(ticker) as OHLCVBar[];
    barsByTicker.set(ticker, bars);
  }

  db.close();

  return { tickers: tickers.map((t) => t.ticker), barsByTicker };
}

async function run() {
  const { tickers, barsByTicker } = loadBars();
  const sectorMap = await fetchSectorMap();
  if (!sectorMap) {
    console.warn('[warn] Sector map fetch failed (offline?) — sector breakdown will be skipped in the report.');
  }

  const rows: Row[] = [];
  let skippedWarmup = 0;
  let skippedNoNextDay = 0;

  for (const ticker of tickers) {
    const bars = barsByTicker.get(ticker)!;

    for (let t = MIN_BARS_REQUIRED - 1; t < bars.length - 1; t++) {
      const barsUpToT = bars.slice(0, t + 1);
      const snapshot = computeIndicatorSnapshot(barsUpToT);
      if (!snapshot) {
        skippedWarmup++;
        continue;
      }

      const dayT = bars[t];
      const entryBar = bars[t + 1];
      if (!entryBar) {
        skippedNoNextDay++;
        continue;
      }

      const momentumScore = computeMomentumScore(snapshot);
      const entry = entryBar.open;

      const gapPct = ((entryBar.open - dayT.close) / dayT.close) * 100;
      const value = dayT.close * dayT.volume;

      const oneDay = windowStats(bars, entry, t + 1, t + 1)!;
      const threeDay = windowStats(bars, entry, t + 1, t + 3);
      const fiveDay = windowStats(bars, entry, t + 1, t + 5);

      const ret_o2h_1d = pctReturn(entry, entryBar.high);
      const win = ret_o2h_1d >= WIN_THRESHOLD_PCT;
      const realizedRR_1d = oneDay.mae < 0 ? Math.abs(oneDay.mfe / oneDay.mae) : null;

      const dayRange = dayT.high - dayT.low;
      const closeNearHighPct = dayRange > 0 ? (dayT.close - dayT.low) / dayRange : 0.5;
      const falseBreakout = closeNearHighPct > 0.9 && entryBar.close < dayT.close;

      rows.push({
        ticker,
        date: dayT.date,
        entryDate: entryBar.date,
        sector: sectorMap ? sectorMap[ticker] ?? null : null,

        closeAtT: dayT.close,
        momentumScore,
        rsi14: snapshot.rsi14,
        macd: snapshot.macd,
        macdSignal: snapshot.macdSignal,
        macdHistogram: snapshot.macdHistogram,
        ema9: snapshot.ema9,
        ema20: snapshot.ema20,
        ema50: snapshot.ema50,
        relativeVolume: snapshot.relativeVolume,
        higherHigh: snapshot.higherHigh,
        higherLow: snapshot.higherLow,

        value,
        gapPct,

        entry,

        ret_o2h_1d,
        ret_o2c_1d: oneDay.ret,
        mfe_1d: oneDay.mfe,
        mae_1d: oneDay.mae,
        win,
        realizedRR_1d,

        ret_o2c_3d: threeDay ? threeDay.ret : null,
        mfe_3d: threeDay ? threeDay.mfe : null,
        mae_3d: threeDay ? threeDay.mae : null,

        ret_o2c_5d: fiveDay ? fiveDay.ret : null,
        mfe_5d: fiveDay ? fiveDay.mfe : null,
        mae_5d: fiveDay ? fiveDay.mae : null,

        falseBreakout,

        emaState: classifyEmaState(snapshot.ema20, snapshot.ema50, snapshot.lastClose),
        macdState: classifyMacdState(snapshot.macd, snapshot.macdSignal, snapshot.lastClose),
      });
    }
  }

  const outDir = path.join(process.cwd(), 'scripts', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'backtest-raw.json'), JSON.stringify(rows));

  console.log(`Tickers processed: ${tickers.length}`);
  console.log(`Observations: ${rows.length}`);
  console.log(`Skipped (warmup < ${MIN_BARS_REQUIRED} bars): ${skippedWarmup}`);
  console.log(`Skipped (no next-day bar): ${skippedNoNextDay}`);
  console.log(`Sector map available: ${!!sectorMap}`);
  console.log(`Wrote raw data to ${path.join(outDir, 'backtest-raw.json')}`);
}

run();
