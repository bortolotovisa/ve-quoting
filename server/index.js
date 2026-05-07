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
  await pool.query(`CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, client TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]', total_hours NUMERIC DEFAULT 0
  )`);

  // Recreate history if schema changed
  try {
    const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='infor_history' AND column_name='total_est'");
    if (r.rows.length === 0) throw new Error('missing wos column');
  } catch(e) {
    await pool.query('DROP TABLE IF EXISTS infor_history');
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS infor_history (
    id SERIAL PRIMARY KEY, part_num TEXT NOT NULL, description TEXT NOT NULL,
    shop TEXT NOT NULL, total_hrs NUMERIC DEFAULT 0, total_est NUMERIC DEFAULT 0,
    wo_count INTEGER DEFAULT 1, wos JSONB NOT NULL DEFAULT '[]'
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hp ON infor_history(part_num)');

  // Track which dataset version is loaded — if the JSON file has more parts than the DB,
  // we re-import to pick up updates. We use part count as a fast heuristic for detecting
  // a refreshed dataset; for full data integrity in incremental updates we rebuild from scratch.
  await pool.query(`CREATE TABLE IF NOT EXISTS infor_history_meta (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  )`);

  const { rows } = await pool.query('SELECT COUNT(*) FROM infor_history');
  const dbCount = parseInt(rows[0].count);
  const hp = path.join(__dirname, 'infor_history.json');

  let shouldImport = dbCount === 0;

  // If DB already has data, check if the JSON file is newer/larger and we should re-import
  if (!shouldImport && fs.existsSync(hp)) {
    const fileStat = fs.statSync(hp);
    const fileMtime = fileStat.mtimeMs.toString();
    const lastImported = await pool.query("SELECT value FROM infor_history_meta WHERE key='last_imported_mtime'");
    const lastMtime = lastImported.rows[0]?.value;

    if (lastMtime !== fileMtime) {
      console.log(`Infor history JSON updated (mtime changed). Re-importing...`);
      console.log(`  DB has ${dbCount} parts, will refresh from file.`);
      await pool.query('TRUNCATE infor_history');
      shouldImport = true;
    }
  }

  if (shouldImport && fs.existsSync(hp)) {
    console.log('Importing Infor history...');
    const fileStat = fs.statSync(hp);
    const data = JSON.parse(fs.readFileSync(hp, 'utf8'));

    // FIX: PDF parser truncated some dates (e.g. "07-Jan-202" instead of "07-Jan-2025").
    // Since 202X spans 2020-2029 and 201X spans 2010-2019, we cannot reliably
    // recover the missing digit. Per user direction: don't show what we don't know.
    // We drop truncated dates entirely — the UI will simply show "—" for missing dates.
    const fixDate = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return dateStr;
      // Match dd-Mon-XXX where XXX is exactly 3 digits (truncated year)
      const m = dateStr.match(/^(\d{1,2}-[A-Za-z]{3}-)(\d{3})$/);
      if (!m) return dateStr;
      return null;
    };

    data.forEach(item => {
      if (Array.isArray(item.wos)) {
        item.wos.forEach(wo => { if (wo.d) wo.d = fixDate(wo.d); });
      }
    });

    const bs = 50;
    for (let i = 0; i < data.length; i += bs) {
      const batch = data.slice(i, i + bs);
      const vals = []; const params = [];
      batch.forEach((item, j) => {
        const b = j * 7;
        vals.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7})`);
        params.push(item.part_num, item.description||'', item.shop||'General',
          item.total_hrs||0, item.total_est||0, item.wo_count||1, JSON.stringify(item.wos||[]));
      });
      await pool.query(`INSERT INTO infor_history (part_num,description,shop,total_hrs,total_est,wo_count,wos) VALUES ${vals.join(',')}`, params);
      if (i % 2000 === 0) console.log('  ' + i + '/' + data.length);
    }
    console.log('Imported ' + data.length + ' parts');

    // Record file mtime so we know what version is loaded
    await pool.query(
      `INSERT INTO infor_history_meta (key, value) VALUES ('last_imported_mtime', $1)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`,
      [fileStat.mtimeMs.toString()]
    );
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
    'SELECT part_num,description,shop,total_hrs,total_est,wo_count,wos FROM infor_history WHERE part_num ILIKE $1 OR description ILIKE $1 ORDER BY total_hrs DESC LIMIT 30',
    ['%'+q+'%']);
  res.json(rows);
});

// Live stats — used by the History header so counts stay accurate after data updates
app.get('/api/history/stats', async (_req, res) => {
  const partsR = await pool.query('SELECT COUNT(*) FROM infor_history');
  const wosR = await pool.query("SELECT COALESCE(SUM(jsonb_array_length(wos)),0) AS total FROM infor_history");
  res.json({
    parts: parseInt(partsR.rows[0].count),
    work_orders: parseInt(wosR.rows[0].total),
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

initDB().then(() => {
  app.listen(PORT, () => console.log('VE Quoting on port ' + PORT));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
