import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3001;

  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
