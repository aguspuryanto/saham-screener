const { fetchYahooDailyBars } = require('./yahooHistory');

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function readCachedBars(db, ticker) {
  return db
    .prepare('SELECT date, open, high, low, close, volume FROM daily_bars WHERE ticker = ? ORDER BY date ASC')
    .all(ticker);
}

function upsertBars(db, ticker, bars) {
  const fetchedAt = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO daily_bars (ticker, date, open, high, low, close, volume, source, fetched_at)
    VALUES (@ticker, @date, @open, @high, @low, @close, @volume, 'yahoo', @fetchedAt)
    ON CONFLICT(ticker, date) DO UPDATE SET
      open = excluded.open,
      high = excluded.high,
      low = excluded.low,
      close = excluded.close,
      volume = excluded.volume,
      fetched_at = excluded.fetched_at
  `);

  const insertMany = db.transaction((rows) => {
    for (const bar of rows) {
      insert.run({ ticker, fetchedAt, ...bar });
    }
  });

  insertMany(bars);
}

function upsertFetchLog(db, ticker, status, barCount, errorMessage) {
  db.prepare(`
    INSERT INTO history_fetch_log (ticker, last_fetched_at, last_status, bar_count, last_error)
    VALUES (@ticker, @fetchedAt, @status, @barCount, @error)
    ON CONFLICT(ticker) DO UPDATE SET
      last_fetched_at = excluded.last_fetched_at,
      last_status = excluded.last_status,
      bar_count = excluded.bar_count,
      last_error = excluded.last_error
  `).run({
    ticker,
    fetchedAt: new Date().toISOString(),
    status,
    barCount,
    error: errorMessage || null,
  });
}

function registerHistoryRoutes(app, db) {
  app.get('/api/stocks/:code/history', async (req, res) => {
    const code = String(req.params.code || '').toUpperCase();
    const range = String(req.query.range || '2y');

    if (!code) {
      return res.status(400).json({ code, ok: false, reason: 'error', message: 'Missing ticker code' });
    }

    const log = db.prepare('SELECT * FROM history_fetch_log WHERE ticker = ?').get(code);
    const isFreshToday = log && log.last_status === 'ok' && log.last_fetched_at.slice(0, 10) === todayDateString();

    if (isFreshToday) {
      const bars = readCachedBars(db, code);
      return res.json({ code, ok: true, bars, source: 'cache' });
    }

    const result = await fetchYahooDailyBars(code, range);

    if (result.ok) {
      upsertBars(db, code, result.bars);
      upsertFetchLog(db, code, 'ok', result.bars.length, null);
      const bars = readCachedBars(db, code);
      return res.json({ code, ok: true, bars, source: 'yahoo' });
    }

    upsertFetchLog(db, code, result.reason, 0, result.message || null);

    const staleBars = readCachedBars(db, code);
    if (staleBars.length > 0) {
      return res.json({ code, ok: true, bars: staleBars, source: 'cache' });
    }

    return res.json({ code, ok: false, reason: result.reason, message: result.message });
  });
}

module.exports = { registerHistoryRoutes };
