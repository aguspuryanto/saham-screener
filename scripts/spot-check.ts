import path from 'path';
import Database from 'better-sqlite3';
import { computeIndicatorSnapshot } from '../src/domain/indicators';
import { computeMomentumScore } from '../src/domain/engine/scores';
import { OHLCVBar } from '../src/domain/models/History';

const TICKER = process.argv[2] || 'ASGR';

const dbPath = path.join(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath, { readonly: true });
const bars = db
  .prepare('SELECT date, open, high, low, close, volume FROM daily_bars WHERE ticker = ? ORDER BY date ASC')
  .all(TICKER) as OHLCVBar[];
db.close();

// Independently recompute the snapshot as of the second-to-last bar (t = len-2),
// exactly matching the last row the backtest script would have produced for this ticker.
const t = bars.length - 2;
const barsUpToT = bars.slice(0, t + 1);
const snapshot = computeIndicatorSnapshot(barsUpToT);
if (!snapshot) throw new Error('Not enough bars');

console.log(`Ticker: ${TICKER}, date(t)=${bars[t].date}, entryDate=${bars[t + 1].date}`);
console.log('Independently recomputed snapshot:', {
  momentumScore: computeMomentumScore(snapshot),
  rsi14: snapshot.rsi14,
  macd: snapshot.macd,
  macdSignal: snapshot.macdSignal,
  ema9: snapshot.ema9,
  ema20: snapshot.ema20,
  ema50: snapshot.ema50,
  relativeVolume: snapshot.relativeVolume,
  higherHigh: snapshot.higherHigh,
  higherLow: snapshot.higherLow,
});
