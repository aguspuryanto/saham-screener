/**
 * Vercel Serverless Function: /api/stocks/:code/history
 *
 * Proxy ke Yahoo Finance untuk data historis harian. Setara dengan
 * server/historyRoutes.js yang dipakai saat development lokal, tapi
 * tanpa cache sqlite karena filesystem serverless bersifat ephemeral.
 */
function toDateString(unixSeconds, gmtOffsetSeconds) {
  const shifted = new Date((unixSeconds + gmtOffsetSeconds) * 1000);
  return shifted.toISOString().slice(0, 10);
}

async function fetchYahooDailyBars(code, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(code)}.JK?range=${encodeURIComponent(range)}&interval=1d`;

  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
  } catch (error) {
    return { ok: false, reason: 'error', message: error.message };
  }

  if (!response.ok) {
    if (response.status === 404) {
      return { ok: false, reason: 'not_found' };
    }
    return { ok: false, reason: 'error', message: `HTTP ${response.status}` };
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    return { ok: false, reason: 'error', message: 'Invalid JSON from Yahoo' };
  }

  const result = payload && payload.chart && payload.chart.result && payload.chart.result[0];
  if (!result) {
    return { ok: false, reason: 'not_found' };
  }

  const timestamps = result.timestamp || [];
  const quote = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {};
  const gmtOffset = (result.meta && result.meta.gmtoffset) || 0;

  const bars = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open ? quote.open[i] : null;
    const high = quote.high ? quote.high[i] : null;
    const low = quote.low ? quote.low[i] : null;
    const close = quote.close ? quote.close[i] : null;
    const volume = quote.volume ? quote.volume[i] : null;

    if (open == null || high == null || low == null || close == null) {
      continue;
    }

    bars.push({
      date: toDateString(timestamps[i], gmtOffset),
      open,
      high,
      low,
      close,
      volume: volume == null ? 0 : volume,
    });
  }

  if (bars.length === 0) {
    return { ok: false, reason: 'not_found' };
  }

  return { ok: true, bars };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const code = String(req.query.code || '').toUpperCase();
  const range = String(req.query.range || '2y');

  if (!code) {
    return res.status(400).json({ code, ok: false, reason: 'error', message: 'Missing ticker code' });
  }

  const result = await fetchYahooDailyBars(code, range);

  if (result.ok) {
    return res.status(200).json({ code, ok: true, bars: result.bars, source: 'yahoo' });
  }

  return res.status(200).json({ code, ok: false, reason: result.reason, message: result.message });
}
