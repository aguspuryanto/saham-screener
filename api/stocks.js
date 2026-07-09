/**
 * Vercel Serverless Function: /api/stocks
 *
 * Berfungsi sebagai proxy ke pasardana.id agar tidak ada CORS issue
 * di production (Vercel). Endpoint ini identik dengan route di server.ts
 * yang digunakan saat development lokal.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(
      'https://pasardana.id/api/StockSearchResult/GetAll?pageBegin=0&pageLength=1000&sortField=Code&sortOrder=ASC'
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from pasardana:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
}
