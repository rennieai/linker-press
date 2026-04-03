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
app.use(express.static(path.resolve(__dirname, 'dist')));

// ── API ENDPOINTS (Communal Relay) ───────────────────────────────

app.get('/api/articles', (req, res) => {
  res.json(globalArticles);
});

app.post('/api/articles', (req, res) => {
  const newArticle = req.body;
  globalArticles.push(newArticle);
  if (globalArticles.length > 100) globalArticles.shift();
  res.status(201).json({ success: true });
});

// Health check for Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

// ──────────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

// IMPORTANT: Listen on 0.0.0.0 on the Railway-assigned PORT
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Linker Press Core active on 0.0.0.0:${PORT}`);
});
