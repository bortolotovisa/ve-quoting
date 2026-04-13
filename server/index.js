const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

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
    CREATE TABLE IF NOT EXISTS infor_history (
      id SERIAL PRIMARY KEY,
      part_num TEXT NOT NULL,
      description TEXT NOT NULL,
      shop TEXT NOT NULL,
      total_hrs NUMERIC DEFAULT 0,
      operations JSONB NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_infor_part_num ON infor_history(part_num);
  `);

  const { rows } = await pool.query('SELECT COUNT(*) FROM infor_history');
  if (parseInt(rows[0].count) === 0) {
    const historyPath = path.join(__dirname, 'infor_history.json');
    if (fs.existsSync(historyPath)) {
      console.log('Importing Infor history...');
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      for (const item of data) {
        await pool.query(
          'INSERT INTO infor_history (part_num, description, shop, total_hrs, operations) VALUES ($1,$2,$3,$4,$5)',
          [item.part_num, item.description, item.shop, item.total_hrs, JSON.stringify(item.operations)]
        );
      }
      console.log('Imported ' + data.length + ' parts from Infor 2025');
    }
  }
  console.log('DB ready');
}

// Quotes
app.get('/api/quotes', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, client, created_at, updated_at, total_hours, jsonb_array_length(items) as item_count FROM quotes ORDER BY updated_at DESC'
  );
  res.json(rows);
});

app.get('/api/quotes/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM quotes WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

app.post('/api/quotes', async (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  await pool.query(
    'INSERT INTO quotes (id,name,client,created_at,updated_at,items,total_hours) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, name || 'New quote', client || '', now, now, JSON.stringify(items || []), total_hours || 0]
  );
  res.json({ id });
});

app.put('/api/quotes/:id', async (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const now = new Date().toISOString();
  await pool.query(
    'UPDATE quotes SET name=$1,client=$2,items=$3,total_hours=$4,updated_at=$5 WHERE id=$6',
    [name, client || '', JSON.stringify(items || []), total_hours || 0, now, req.params.id]
  );
  res.json({ ok: true });
});

app.delete('/api/quotes/:id', async (req, res) => {
  await pool.query('DELETE FROM quotes WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// History search
app.get('/api/history/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);
  const { rows } = await pool.query(
    'SELECT part_num, description, shop, total_hrs, operations FROM infor_history WHERE part_num ILIKE $1 OR description ILIKE $1 ORDER BY total_hrs DESC LIMIT 30',
    ['%' + q + '%']
  );
  res.json(rows);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

initDB().then(() => {
  app.listen(PORT, () => console.log('VE Quoting on port ' + PORT));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
