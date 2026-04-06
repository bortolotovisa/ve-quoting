const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      items JSONB NOT NULL DEFAULT '[]',
      total_hours NUMERIC DEFAULT 0
    );
  `);
  console.log('DB ready');
}

// GET all quotes
app.get('/api/quotes', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, client, created_at, updated_at, total_hours,
            jsonb_array_length(items) as item_count
     FROM quotes ORDER BY updated_at DESC`
  );
  res.json(rows);
});

// GET single quote
app.get('/api/quotes/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM quotes WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST create quote
app.post('/api/quotes', async (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO quotes (id, name, client, created_at, updated_at, items, total_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name || 'New quote', client || '', now, now, JSON.stringify(items || []), total_hours || 0]
  );
  res.json({ id });
});

// PUT update quote
app.put('/api/quotes/:id', async (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE quotes SET name=$1, client=$2, items=$3, total_hours=$4, updated_at=$5 WHERE id=$6`,
    [name, client || '', JSON.stringify(items || []), total_hours || 0, now, req.params.id]
  );
  res.json({ ok: true });
});

// DELETE quote
app.delete('/api/quotes/:id', async (req, res) => {
  await pool.query('DELETE FROM quotes WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Serve React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

initDB().then(() => {
  app.listen(PORT, () => console.log(`VE Quoting on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
