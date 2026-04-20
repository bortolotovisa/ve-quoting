const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '20mb' }));

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

  try {
    const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='infor_history' AND column_name='wos'");
    if (r.rows.length === 0) throw new Error('missing wos column');
  } catch(e) {
    await pool.query('DROP TABLE IF EXISTS infor_history');
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS infor_history (
    id SERIAL PRIMARY KEY, part_num TEXT NOT NULL, description TEXT NOT NULL,
    shop TEXT NOT NULL, total_hrs NUMERIC DEFAULT 0, wo_count INTEGER DEFAULT 1,
    wos JSONB NOT NULL DEFAULT '[]'
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hp ON infor_history(part_num)');

  const { rows } = await pool.query('SELECT COUNT(*) FROM infor_history');
  if (parseInt(rows[0].count) === 0) {
    const hp = path.join(__dirname, 'infor_history.json');
    if (fs.existsSync(hp)) {
      console.log('Importing Infor history...');
      const data = JSON.parse(fs.readFileSync(hp, 'utf8'));
      const bs = 50;
      for (let i = 0; i < data.length; i += bs) {
        const batch = data.slice(i, i + bs);
        const vals = []; const params = [];
        batch.forEach((item, j) => {
          const b = j * 6;
          vals.push(`($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6})`);
          params.push(item.part_num, item.description||'', item.shop||'General',
            item.total_hrs||0, item.wo_count||1, JSON.stringify(item.wos||[]));
        });
        await pool.query(`INSERT INTO infor_history (part_num,description,shop,total_hrs,wo_count,wos) VALUES ${vals.join(',')}`, params);
        if (i % 2000 === 0) console.log('  ' + i + '/' + data.length);
      }
      console.log('Imported ' + data.length + ' parts');
    }
  }
  console.log('DB ready');
}

// ── Quotes CRUD ───────────────────────────────────────────────
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

// ── Infor history search ───────────────────────────────────────
app.get('/api/history/search', async (req, res) => {
  const q = (req.query.q||'').trim();
  if (!q || q.length < 2) return res.json([]);
  const { rows } = await pool.query(
    'SELECT part_num,description,shop,total_hrs,wo_count,wos FROM infor_history WHERE part_num ILIKE $1 OR description ILIKE $1 ORDER BY total_hrs DESC LIMIT 30',
    ['%'+q+'%']);
  res.json(rows);
});

// ── AI Drawing Analyzer ───────────────────────────────────────
const DRAWING_SYSTEM_PROMPT = `You are an expert estimator for a store fixtures manufacturer (Visual Elements, Vaughan Ontario) specializing in wood and metal components: MDF cabinets, melamine panels, lacquered and veneer finishes, metal frames, CNC-machined parts, edge banding, and hardware (Blum, Hafele, Sugatsune).

Analyze the uploaded drawing or render and produce a detailed production quote.

Rules:
- Be realistic for a North American custom millwork / store fixtures shop
- Labour rates: CNC programming CA$75/h, CNC machining CA$65/h, assembly CA$55/h, finishing CA$50/h, hardware installation CA$45/h
- If dimensions are not visible, estimate from visual proportions and typical retail fixture sizes
- Express hours as decimal (e.g. 2.5)
- All monetary values in CAD
- IMPORTANT: Return ONLY a raw JSON object. No markdown, no backticks, no explanation before or after. Start your response with { and end with }.

JSON structure:
{
  "part_name": "string",
  "confidence": "high or medium or low",
  "summary": "2-3 sentence description",
  "dimensions_estimated": { "width_mm": number, "height_mm": number, "depth_mm": number },
  "materials": [{ "name": "string", "spec": "string", "qty": "string", "unit_cost": number, "total_cost": number }],
  "operations": [{ "operation": "string", "hours": number, "rate_cad": number, "total_cad": number }],
  "hardware": [{ "item": "string", "qty": number, "unit_cost": number, "total_cost": number }],
  "totals": { "materials_cad": number, "labour_cad": number, "hardware_cad": number, "subtotal_cad": number, "markup_15pct": number, "grand_total_cad": number },
  "lead_time_days": number,
  "notes": "string"
}`;

app.post('/api/quotes/analyze-drawing', async (req, res) => {
  const { imageBase64, mimeType, context } = req.body;

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 and mimeType are required.' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(mimeType)) {
    return res.status(400).json({ error: `Unsupported file type: ${mimeType}` });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in environment.' });
  }

  const isPdf = mimeType === 'application/pdf';
  const userContent = [
    {
      type: isPdf ? 'document' : 'image',
      source: { type: 'base64', media_type: mimeType, data: imageBase64 }
    },
    {
      type: 'text',
      text: context
        ? `Analyze and quote. Estimator context: ${context}`
        : 'Analyze this drawing and produce the quote JSON. Remember: respond with raw JSON only, starting with {.'
    }
  ];

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        system: DRAWING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('[analyze-drawing] Anthropic error:', apiData);
      return res.status(apiResponse.status).json({ error: apiData.error?.message || 'Anthropic API error' });
    }

    const rawText = apiData.content.filter(b => b.type === 'text').map(b => b.text).join('');

    // Robust JSON extraction: strip markdown fences, find outermost { ... }
    let cleanText = rawText.replace(/```json|```/g, '').trim();
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd   = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
    }

    let quote;
    try {
      quote = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('[analyze-drawing] JSON parse error:', parseErr.message, '\nRaw:', rawText);
      const preview = rawText.slice(0, 600); return res.status(500).json({ error: 'Parse error. Model said: ' + preview });
    }

    return res.json(quote);

  } catch (networkErr) {
    console.error('[analyze-drawing] Network error:', networkErr.message);
    return res.status(500).json({ error: 'Failed to reach Anthropic API: ' + networkErr.message });
  }
});

// ── Static (production) ───────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

initDB().then(() => {
  app.listen(PORT, () => console.log('VE Quoting on port ' + PORT));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
