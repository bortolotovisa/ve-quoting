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
      id TEXT PRIMARY KEY, name TEXT NOT NULL, client TEXT DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      items JSONB NOT NULL DEFAULT '[]', total_hours NUMERIC DEFAULT 0
    )
  `);

  // Check if we need to recreate history table with materials
  let needsRecreate = false;
  try {
    await pool.query('SELECT materials FROM infor_history LIMIT 1');
  } catch(e) {
    needsRecreate = true;
  }

  if (needsRecreate) {
    console.log('Recreating infor_history with materials column...');
    await pool.query('DROP TABLE IF EXISTS infor_history');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS infor_history (
      id SERIAL PRIMARY KEY, part_num TEXT NOT NULL, description TEXT NOT NULL,
      shop TEXT NOT NULL, total_hrs NUMERIC DEFAULT 0, wo_count INTEGER DEFAULT 1,
      operations JSONB NOT NULL DEFAULT '[]', materials JSONB NOT NULL DEFAULT '[]'
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hist_pn ON infor_history(part_num)');

  const { rows } = await pool.query('SELECT COUNT(*) FROM infor_history');
  if (parseInt(rows[0].count) === 0) {
    const hp = path.join(__dirname, 'infor_history.json');
    if (fs.existsSync(hp)) {
      console.log('Importing Infor history...');
      const data = JSON.parse(fs.readFileSync(hp, 'utf8'));
      const bs = 100;
      for (let i = 0; i < data.length; i += bs) {
        const batch = data.slice(i, i + bs);
        const vals = []; const params = [];
        batch.forEach((item, j) => {
          const b = j * 7;
          vals.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7})`);
          params.push(item.part_num, item.description||'', item.shop||'General',
            item.total_hrs||0, item.wo_count||1,
            JSON.stringify(item.operations||[]), JSON.stringify(item.materials||[]));
        });
        await pool.query(`INSERT INTO infor_history (part_num,description,shop,total_hrs,wo_count,operations,materials) VALUES ${vals.join(',')}`, params);
        if (i % 2000 === 0) console.log('  imported ' + i + '/' + data.length);
      }
      console.log('Imported ' + data.length + ' parts');
    }
  }
  console.log('DB ready');
}

app.get('/api/quotes', async (req, res) => {
  const { rows } = await pool.query('SELECT id,name,client,created_at,updated_at,total_hours,jsonb_array_length(items) as item_count FROM quotes ORDER BY updated_at DESC');
  res.json(rows);
});
app.get('/api/quotes/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM quotes WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({error:'Not found'});
  res.json(rows[0]);
});
app.post('/api/quotes', async (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const id = uuidv4(); const now = new Date().toISOString();
  await pool.query('INSERT INTO quotes (id,name,client,created_at,updated_at,items,total_hours) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, name||'New quote', client||'', now, now, JSON.stringify(items||[]), total_hours||0]);
  res.json({ id });
});
app.put('/api/quotes/:id', async (req, res) => {
  const { name, client, items, total_hours } = req.body;
  const now = new Date().toISOString();
  await pool.query('UPDATE quotes SET name=$1,client=$2,items=$3,total_hours=$4,updated_at=$5 WHERE id=$6',
    [name, client||'', JSON.stringify(items||[]), total_hours||0, now, req.params.id]);
  res.json({ok:true});
});
app.delete('/api/quotes/:id', async (req, res) => {
  await pool.query('DELETE FROM quotes WHERE id=$1', [req.params.id]);
  res.json({ok:true});
});

app.get('/api/history/search', async (req, res) => {
  const q = (req.query.q||'').trim();
  if (!q || q.length < 2) return res.json([]);
  const { rows } = await pool.query(
    'SELECT part_num,description,shop,total_hrs,wo_count,operations,materials FROM infor_history WHERE part_num ILIKE $1 OR description ILIKE $1 ORDER BY total_hrs DESC LIMIT 30',
    ['%'+q+'%']);
  res.json(rows);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

initDB().then(() => {
  app.listen(PORT, () => console.log('VE Quoting on port ' + PORT));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
