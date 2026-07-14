const SELECT_CAMELCASE = `
  SELECT
    id, ticker,
    logged_at AS loggedAt,
    watchlist_score AS watchlistScore,
    watchlist_tier AS watchlistTier,
    entry_price AS entryPrice,
    exit_price AS exitPrice,
    stop_loss AS stopLoss,
    take_profit AS takeProfit,
    result_pct AS resultPct,
    max_drawdown_pct AS maxDrawdownPct,
    max_profit_intraday_pct AS maxProfitIntradayPct,
    entry_reason AS entryReason,
    exit_reason AS exitReason
  FROM trade_journal
`;

function listEntries(db) {
  return db.prepare(`${SELECT_CAMELCASE} ORDER BY logged_at DESC, id DESC`).all();
}

function insertEntry(db, entry) {
  const insert = db.prepare(`
    INSERT INTO trade_journal (
      ticker, logged_at, watchlist_score, watchlist_tier,
      entry_price, exit_price, stop_loss, take_profit,
      result_pct, max_drawdown_pct, max_profit_intraday_pct,
      entry_reason, exit_reason
    ) VALUES (
      @ticker, @loggedAt, @watchlistScore, @watchlistTier,
      @entryPrice, @exitPrice, @stopLoss, @takeProfit,
      @resultPct, @maxDrawdownPct, @maxProfitIntradayPct,
      @entryReason, @exitReason
    )
  `);
  const result = insert.run(entry);
  return db.prepare(`${SELECT_CAMELCASE} WHERE id = ?`).get(result.lastInsertRowid);
}

function registerTradeJournalRoutes(app, db) {
  app.get('/api/journal', (req, res) => {
    res.json({ ok: true, entries: listEntries(db) });
  });

  app.post('/api/journal', (req, res) => {
    const body = req.body || {};
    const ticker = String(body.ticker || '').toUpperCase().trim();

    if (!ticker) {
      return res.status(400).json({ ok: false, message: 'Ticker wajib diisi' });
    }

    const entry = {
      ticker,
      loggedAt: new Date().toISOString(),
      watchlistScore: body.watchlistScore ?? null,
      watchlistTier: body.watchlistTier ?? null,
      entryPrice: body.entryPrice ?? null,
      exitPrice: body.exitPrice ?? null,
      stopLoss: body.stopLoss ?? null,
      takeProfit: body.takeProfit ?? null,
      resultPct: body.resultPct ?? null,
      maxDrawdownPct: body.maxDrawdownPct ?? null,
      maxProfitIntradayPct: body.maxProfitIntradayPct ?? null,
      entryReason: body.entryReason ?? null,
      exitReason: body.exitReason ?? null,
    };

    const saved = insertEntry(db, entry);
    res.json({ ok: true, entry: saved });
  });
}

module.exports = { registerTradeJournalRoutes };
