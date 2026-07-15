/**
 * Vercel Serverless Function: /api/journal
 *
 * Setara dengan server/tradeJournalRoutes.js yang dipakai saat development
 * lokal (better-sqlite3), tapi lewat Turso (libSQL) karena filesystem
 * serverless bersifat ephemeral dan endpoint ini butuh menulis data.
 */
import { getClient, ensureSchema } from './_lib/turso.js';

const SELECT_CAMELCASE = `
  SELECT
    id, ticker,
    logged_at AS loggedAt,
    entry_date AS entryDate,
    exit_date AS exitDate,
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

async function listEntries(db) {
  const result = await db.execute(`${SELECT_CAMELCASE} ORDER BY logged_at DESC, id DESC`);
  return result.rows;
}

async function insertEntry(db, entry) {
  const insert = await db.execute({
    sql: `
      INSERT INTO trade_journal (
        ticker, logged_at, entry_date, exit_date, watchlist_score, watchlist_tier,
        entry_price, exit_price, stop_loss, take_profit,
        result_pct, max_drawdown_pct, max_profit_intraday_pct,
        entry_reason, exit_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      entry.ticker,
      entry.loggedAt,
      entry.entryDate,
      entry.exitDate,
      entry.watchlistScore,
      entry.watchlistTier,
      entry.entryPrice,
      entry.exitPrice,
      entry.stopLoss,
      entry.takeProfit,
      entry.resultPct,
      entry.maxDrawdownPct,
      entry.maxProfitIntradayPct,
      entry.entryReason,
      entry.exitReason,
    ],
  });

  const result = await db.execute({
    sql: `${SELECT_CAMELCASE} WHERE id = ?`,
    args: [insert.lastInsertRowid],
  });
  return result.rows[0];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let db;
  try {
    db = getClient();
    await ensureSchema(db);
  } catch (error) {
    console.error('Turso client error:', error);
    return res.status(500).json({ ok: false, message: error.message });
  }

  if (req.method === 'GET') {
    try {
      const entries = await listEntries(db);
      return res.status(200).json({ ok: true, entries });
    } catch (error) {
      console.error('Failed to list journal entries:', error);
      return res.status(500).json({ ok: false, message: 'Failed to fetch journal entries' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const ticker = String(body.ticker || '').toUpperCase().trim();

    if (!ticker) {
      return res.status(400).json({ ok: false, message: 'Ticker wajib diisi' });
    }

    const entry = {
      ticker,
      loggedAt: new Date().toISOString(),
      entryDate: body.entryDate || new Date().toISOString().slice(0, 10),
      exitDate: body.exitDate ?? null,
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

    try {
      const saved = await insertEntry(db, entry);
      return res.status(200).json({ ok: true, entry: saved });
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      return res.status(500).json({ ok: false, message: 'Failed to save journal entry' });
    }
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
