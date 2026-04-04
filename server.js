import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// In-memory communal relay cache (shared across all users per process lifetime)
let globalArticles = [];

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.resolve(__dirname, 'dist'), {
  maxAge: '1h',
  etag: true
}));

// ── API: Communal Article Relay ───────────────────────────────────

app.get('/api/articles', (req, res) => {
  res.json(globalArticles);
});

app.post('/api/articles', (req, res) => {
  const newArticle = req.body;
  if (!newArticle || !newArticle.id) {
    return res.status(400).json({ error: 'Invalid article payload' });
  }
  // Deduplicate by id
  const exists = globalArticles.find(a => a.id === newArticle.id);
  if (!exists) {
    globalArticles.unshift(newArticle);
    if (globalArticles.length > 200) globalArticles.pop();
  }
  res.status(201).json({ success: true, total: globalArticles.length });
});

// ── Health check (Railway pings this) ────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    uptime: process.uptime().toFixed(1) + 's',
    articles: globalArticles.length,
    port: PORT
  });
});

// ── SPA fallback: serve index.html for all non-API routes ─────────
app.get('*', (req, res) => {
  const indexPath = path.resolve(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[ERROR] Could not serve index.html: ${err.message}`);
      res.status(500).send('Server error. Check deployment logs.');
    }
  });
});

// ── Start listening ───────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LINKER PRESS] Server live on 0.0.0.0:${PORT}`);
  console.log(`[LINKER PRESS] Serving dist from: ${path.resolve(__dirname, 'dist')}`);
  console.log(`[LINKER PRESS] Health check: http://0.0.0.0:${PORT}/health`);
});

server.on('error', (err) => {
  console.error(`[CRITICAL] Server startup failure: ${err.message}`);
  process.exit(1);
});
