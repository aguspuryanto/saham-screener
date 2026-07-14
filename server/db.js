const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let dbInstance = null;

const MIGRATIONS_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS daily_bars (
  ticker      TEXT NOT NULL,
  date        TEXT NOT NULL,
  open        REAL NOT NULL,
  high        REAL NOT NULL,
  low         REAL NOT NULL,
  close       REAL NOT NULL,
  volume      INTEGER NOT NULL,
  source      TEXT NOT NULL DEFAULT 'yahoo',
  fetched_at  TEXT NOT NULL,
  PRIMARY KEY (ticker, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_bars_ticker ON daily_bars(ticker);

CREATE TABLE IF NOT EXISTS history_fetch_log (
  ticker           TEXT PRIMARY KEY,
  last_fetched_at  TEXT NOT NULL,
  last_status      TEXT NOT NULL,
  bar_count        INTEGER NOT NULL DEFAULT 0,
  last_error       TEXT
);

CREATE TABLE IF NOT EXISTS trade_journal (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker                    TEXT NOT NULL,
  logged_at                 TEXT NOT NULL,
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
);
CREATE INDEX IF NOT EXISTS idx_trade_journal_ticker ON trade_journal(ticker);
`;

function resolveDbPath() {
  const override = process.env.SQLITE_DB_PATH;
  if (override) return override;
  return path.join(process.cwd(), 'data', 'app.db');
}

function getDb() {
  if (dbInstance) return dbInstance;

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  dbInstance = new Database(dbPath);
  dbInstance.exec(MIGRATIONS_SQL);

  return dbInstance;
}

module.exports = { getDb, resolveDbPath };
