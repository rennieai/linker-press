import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Communal Article Cache (In-memory for 24/7 relay)
let globalArticles = [];

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// ── API ENDPOINTS (Communal Relay) ───────────────────────────────

app.get('/api/articles', (req, res) => {
  res.json(globalArticles);
});

app.post('/api/articles', (req, res) => {
  const newArticle = req.body;
  globalArticles.push(newArticle);
  // Keep the stash clean (last 100 articles)
  if (globalArticles.length > 100) globalArticles.shift();
  res.status(201).json({ success: true, signalId: newArticle.id });
});

// ──────────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Linker Press Full-Stack Relay is live on port ${PORT}`);
});
