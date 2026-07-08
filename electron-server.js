const express = require('express');
const path = require('path');
const { getDb } = require('./server/db');
const { registerHistoryRoutes } = require('./server/historyRoutes');

function startServer() {
  const app = express();
  const PORT = 3001;

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const db = getDb();
  registerHistoryRoutes(app, db);

  app.get("/api/stocks", async (req, res) => {
    try {
      const response = await fetch('https://pasardana.id/api/StockSearchResult/GetAll?pageBegin=0&pageLength=1000&sortField=Code&sortOrder=ASC');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching from pasardana:", error);
      res.status(500).json({ error: "Failed to fetch stocks" });
    }
  });

  // Serve static files from dist
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { startServer };
