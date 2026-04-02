const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new Database(process.env.DB_PATH || './quotes.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    items TEXT NOT NULL,
    total_hours REAL DEFAULT 0
  );
`);

// GET all quotes
app.get('/api/quotes', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, client, created_at, updated_at, total_hours,
           json_array_length(items) as item_count
    FROM quotes ORDER BY updated_at DESC
  `).all();
  res.json(rows);
});

// GET single quote
app.get('/api/quotes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  row.items = JSON.parse(row.items);
  res.json(row);
});

// POST create quote
app.post('/api/quotes', (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO quotes (id, name, client, created_at, updated_at, items, total_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name || 'New quote', client || '', now, now, JSON.stringify(items || []), total_hours || 0);
  res.json({ id });
});

// PUT update quote
app.put('/api/quotes/:id', (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE quotes SET name=?, client=?, items=?, total_hours=?, updated_at=?
    WHERE id=?
  `).run(name, client || '', JSON.stringify(items || []), total_hours || 0, now, req.params.id);
  res.json({ ok: true });
});

// DELETE quote
app.delete('/api/quotes/:id', (req, res) => {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Serve React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

app.listen(PORT, () => console.log(`VE Quoting running on port ${PORT}`));
