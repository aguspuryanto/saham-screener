/**
 * Shared Turso (libSQL) client for Vercel Serverless Functions under /api.
 * Vercel functions have no persistent disk, so writes (trade journal) go to
 * this network SQLite-compatible DB instead of the local better-sqlite3 file
 * used by server/db.js during local dev.
 */
import { createClient } from '@libsql/client';

let client = null;
let schemaReady = false;

export function getClient() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      'TURSO_DATABASE_URL / TURSO_AUTH_TOKEN belum diset. Buat database Turso lalu tambahkan kedua env var ini di Vercel project settings.'
    );
  }

  client = createClient({ url, authToken });
  return client;
}

export async function ensureSchema(db) {
  if (schemaReady) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trade_journal (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker                    TEXT NOT NULL,
      logged_at                 TEXT NOT NULL,
      entry_date                TEXT,
      exit_date                 TEXT,
      watchlist_score           REAL,
      watchlist_tier            TEXT,
      entry_price               REAL,
      exit_price                REAL,
      stop_loss                 REAL,
      take_profit               REAL,
      result_pct                REAL,
      max_drawdown_pct          REAL,
      max_profit_intraday_pct   REAL,
      entry_reason              TEXT,
      exit_reason               TEXT
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_trade_journal_ticker ON trade_journal(ticker)`);

  schemaReady = true;
}
