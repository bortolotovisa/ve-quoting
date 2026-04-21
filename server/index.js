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

// ── Helper: search DB for similar parts and build context ──────
async function buildHistoricalContext(keywords) {
  if (!keywords || keywords.length === 0) return '';

  // Build a query using the top keywords
  const terms = keywords.slice(0, 4);
  const conditions = terms.map((_, i) => `(part_num ILIKE $${i+1} OR description ILIKE $${i+1})`).join(' OR ');
  const params = terms.map(t => `%${t}%`);

  const { rows } = await pool.query(
    `SELECT part_num, description, shop, total_hrs, wo_count, wos
     FROM infor_history
     WHERE (${conditions}) AND total_hrs > 0
     ORDER BY total_hrs DESC
     LIMIT 8`,
    params
  );

  if (rows.length === 0) return '';

  // Aggregate ops and mats across all WOs for each part
  const summaries = rows.map(row => {
    const wos = row.wos || [];

    // Aggregate operations (average hours per op type)
    const opMap = {};
    let woCount = 0;
    wos.forEach(wo => {
      if (!wo.ops || wo.ops.length === 0) return;
      woCount++;
      wo.ops.forEach(op => {
        if (!opMap[op.n]) opMap[op.n] = { total: 0, count: 0 };
        opMap[op.n].total += op.h || 0;
        opMap[op.n].count += 1;
      });
    });

    // Aggregate materials (sum quantities across WOs)
    const matMap = {};
    wos.forEach(wo => {
      (wo.mats || []).forEach(m => {
        const key = m.d;
        if (!matMap[key]) matMap[key] = { desc: m.d, qty: 0, times: 0 };
        matMap[key].qty += m.q || 0;
        matMap[key].times += 1;
      });
    });

    const opsStr = Object.entries(opMap)
      .map(([name, v]) => `${name}: ${(v.total / (woCount||1)).toFixed(1)}h avg`)
      .join(', ');

    const matsStr = Object.values(matMap)
      .slice(0, 6)
      .map(m => `${m.desc} (qty: ${(m.qty / (woCount||1)).toFixed(1)} avg)`)
      .join(', ');

    return `• ${row.part_num} — ${row.description} [${row.shop}]
  Hours: ${row.total_hrs}h total across ${row.wo_count} WO(s)
  Operations: ${opsStr || 'N/A'}
  Materials: ${matsStr || 'N/A'}`;
  });

  return `HISTORICAL DATA FROM VE's INFOR ERP (${rows.length} similar parts found):\n${summaries.join('\n\n')}`;
}

// ── AI Drawing Analyzer — Step 1: extract keywords ────────────
const KEYWORD_PROMPT = `You are analyzing a drawing from a store fixtures manufacturer.
Extract 3-5 search keywords from this drawing that would help find similar parts in a database.
Focus on: fixture type, material, finish, size category, client brand if visible.
Return ONLY a JSON array of strings. Example: ["backwall", "oak", "veneer", "lululemon", "cabinet"]
Start with [ and end with ]. No other text.`;

// ── AI Drawing Analyzer — Step 2: generate takeoff ────────────
const TAKEOFF_PROMPT = `You are an expert estimator for Visual Elements (VE), a store fixtures manufacturer in Vaughan, Ontario, Canada.
You specialize in wood and metal components: MDF cabinets, melamine panels, lacquered and veneer finishes, metal frames, CNC-machined parts, edge banding, hardware.

Your job is to generate a MATERIAL AND LABOUR TAKEOFF — quantities only, NO prices.
The orcamentista (estimator) will look up prices separately.

USE THE HISTORICAL VE DATA PROVIDED to anchor your estimates. Match operations and material quantities to what VE has actually produced for similar parts.

Rules:
- Quantities must be realistic based on the drawing dimensions and historical data
- Operations: use VE's real operation names when available (W-CNC, W-ASSEMBLY, W-EDGE-BANDING, W-FINISHING, W-PANEL-SAW, W-PACKAGING)
- Materials: specify type, thickness, and unit (sheets, linear ft, sqft, each, etc.)
- Hardware: list items with quantities (each, pairs, sets)
- If dimensions are visible in the drawing, use them. Otherwise estimate from proportions.
- confidence: "high" if drawing has full dimensions + historical match found, "medium" if partial, "low" if estimating from proportions only
- Return ONLY raw JSON starting with { and ending with }. No markdown, no explanation.

JSON structure:
{
  "part_name": "string",
  "confidence": "high | medium | low",
  "summary": "2-3 sentence description of the piece",
  "dimensions": { "width_mm": number, "height_mm": number, "depth_mm": number, "source": "drawing | estimated" },
  "historical_matches": number,
  "materials": [
    { "item": "string", "spec": "string", "qty": number, "unit": "sheets | sqft | linear_ft | each | linear_m | lbs", "notes": "string" }
  ],
  "operations": [
    { "operation": "string", "hours": number, "notes": "string" }
  ],
  "hardware": [
    { "item": "string", "qty": number, "unit": "each | pairs | sets", "notes": "string" }
  ],
  "total_hours": number,
  "lead_time_days": number,
  "notes": "string — assumptions, caveats, flags for the estimator"
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
  const drawingContent = {
    type: isPdf ? 'document' : 'image',
    source: { type: 'base64', media_type: mimeType, data: imageBase64 }
  };

  try {
    // ── STEP 1: Extract keywords from drawing ─────────────────
    console.log('[analyze-drawing] Step 1: extracting keywords...');
    const step1Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 200,
        system: KEYWORD_PROMPT,
        messages: [{ role: 'user', content: [
          drawingContent,
          { type: 'text', text: context ? `Drawing context: ${context}. Extract search keywords.` : 'Extract search keywords from this drawing.' }
        ]}]
      })
    });

    let keywords = [];
    if (step1Response.ok) {
      const step1Data = await step1Response.json();
      const step1Text = step1Data.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      try {
        const start = step1Text.indexOf('[');
        const end = step1Text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          keywords = JSON.parse(step1Text.slice(start, end + 1));
        }
      } catch(e) {
        console.warn('[analyze-drawing] Could not parse keywords:', step1Text);
      }
    }
    console.log('[analyze-drawing] Keywords:', keywords);

    // ── STEP 2: Search historical DB ──────────────────────────
    console.log('[analyze-drawing] Step 2: searching DB...');
    const historicalContext = await buildHistoricalContext(keywords);
    console.log('[analyze-drawing] Historical context length:', historicalContext.length, 'chars');

    // ── STEP 3: Generate takeoff with historical context ───────
    console.log('[analyze-drawing] Step 3: generating takeoff...');
    const userText = [
      historicalContext ? `${historicalContext}\n\n` : '',
      context ? `Estimator notes: ${context}\n\n` : '',
      'Now analyze the drawing and generate the material and labour takeoff JSON.'
    ].join('');

    const step3Response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4000,
        system: TAKEOFF_PROMPT,
        messages: [{ role: 'user', content: [
          drawingContent,
          { type: 'text', text: userText }
        ]}]
      })
    });

    const step3Data = await step3Response.json();

    if (!step3Response.ok) {
      console.error('[analyze-drawing] Anthropic error:', step3Data);
      return res.status(step3Response.status).json({ error: step3Data.error?.message || 'Anthropic API error' });
    }

    const rawText = step3Data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    let cleanText = rawText.replace(/```json|```/g, '').trim();
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd   = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
    }

    let takeoff;
    try {
      takeoff = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('[analyze-drawing] JSON parse error:', parseErr.message);
      const preview = rawText.slice(0, 400);
      return res.status(500).json({ error: `Parse error: ${preview}` });
    }

    // Attach keywords used for transparency
    takeoff._keywords_used = keywords;
    takeoff._db_searched = keywords.length > 0;

    return res.json(takeoff);

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
