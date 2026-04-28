import { useState, useEffect, useCallback } from 'react';
import s from './HistorySearch.module.css';

// Format date: "07-Jan-2025" -> "07 Jan 2025". Also handles truncated dates as fallback.
function formatDate(d) {
  if (!d) return '';
  // Fallback for any truncated dates that slipped through
  let fixed = d.replace(/-(202)$/, '-2025').replace(/-(201)$/, '-2024').replace(/-(203)$/, '-2026');
  return fixed.replace(/-/g, ' ');
}

// Fmt number with 2 decimals
const f2 = (n) => (n == null ? '—' : Number(n).toFixed(2));

// Variance gauge: small bar that fills left (under) or right (over) from center.
function VarianceGauge({ est, act, big = false }) {
  if (!est || est <= 0) {
    return <span className={`${s.varNone} ${big ? s.varBig : ''}`}>no estimate</span>;
  }
  const diff = act - est;
  const pctNum = (diff / est) * 100;
  const pct = Math.round(pctNum);
  if (pct === 0) {
    return (
      <div className={`${s.varCell} ${big ? s.varBig : ''}`}>
        <div className={s.gauge}>
          <div className={s.gaugeTrack}></div>
          <div className={s.gaugeMid}></div>
        </div>
        <span className={s.varPctNeutral}>0%</span>
      </div>
    );
  }
  const isOver = diff > 0;
  // Cap visual width: 0 to 100% maps to 0 to 50% of gauge width
  const magnitude = Math.min(Math.abs(pctNum), 100);
  const fillWidth = (magnitude / 100) * 50; // out of total 100% width

  return (
    <div className={`${s.varCell} ${big ? s.varBig : ''}`}>
      <div className={s.gauge}>
        <div className={s.gaugeTrack}></div>
        <div
          className={isOver ? s.gaugeFillOver : s.gaugeFillUnder}
          style={isOver ? { width: `${fillWidth}%`, left: '50%' } : { width: `${fillWidth}%`, right: '50%' }}
        ></div>
        <div className={s.gaugeMid}></div>
      </div>
      <span className={isOver ? s.varPctOver : s.varPctUnder}>
        {isOver ? '+' : '−'}{Math.abs(pct)}%
      </span>
    </div>
  );
}

function HoursTab({ wo }) {
  const ops = wo.ops || [];
  const totalAct = ops.reduce((sum, o) => sum + (o.h || 0), 0);
  const totalEst = ops.reduce((sum, o) => sum + (o.e || 0), 0);
  const qty = wo.q || 1;

  // Aggregate by op name
  const byName = {};
  ops.forEach(o => {
    const name = (o.n || '').trim();
    if (!byName[name]) byName[name] = { name, h: 0, e: 0 };
    byName[name].h += o.h || 0;
    byName[name].e += o.e || 0;
  });
  const aggregated = Object.values(byName).sort((a, b) => b.h - a.h);

  return (
    <div className={s.opsTable}>
      <div className={s.opsHeader}>
        <span>Operation</span>
        <span>Distribution</span>
        <span>Est.</span>
        <span>Actual</span>
        <span>Variance</span>
        <span>/unit</span>
      </div>
      {aggregated.map((op, i) => {
        const pct = totalAct > 0 ? (op.h / totalAct) * 100 : 0;
        return (
          <div className={s.opsRow} key={i}>
            <span className={s.opName}>{op.name}</span>
            <div className={s.opBarWrap}>
              <div className={s.opBar}><div className={s.opBarFill} style={{ width: `${pct}%` }}></div></div>
              <span className={s.opBarPct}>{Math.round(pct)}%</span>
            </div>
            <span className={s.opEst}>{op.e > 0 ? f2(op.e) : <span style={{ color: 'var(--border2)' }}>—</span>}</span>
            <span className={s.opAct}>{f2(op.h)}</span>
            <VarianceGauge est={op.e} act={op.h} />
            <span className={s.opUnit}>{f2(op.h / qty)}</span>
          </div>
        );
      })}

      <div className={s.opsTotal}>
        <span className={s.totalLabel}>Total</span>
        <span></span>
        <span className={s.totalEst}>{totalEst > 0 ? f2(totalEst) : '—'}</span>
        <span className={s.totalAct}>{f2(totalAct)} h</span>
        <VarianceGauge est={totalEst} act={totalAct} big />
        <span className={s.totalUnit}>{f2(totalAct / qty)}</span>
      </div>
    </div>
  );
}

function MaterialsTab({ wo }) {
  const mats = wo.mats || [];
  const qty = wo.q || 1;
  const totalCost = mats.reduce((sum, m) => sum + (m.c || 0), 0);

  return (
    <div className={s.matsTable}>
      <div className={s.matsHeader}>
        <span>Item</span>
        <span>Description</span>
        <span>Total qty</span>
        <span>/unit</span>
        <span>Total cost</span>
        <span>$/unit</span>
      </div>
      {mats.map((m, i) => (
        <div className={s.matsRow} key={i}>
          <span className={s.matId}>{m.id}</span>
          <span className={s.matDesc} title={m.d}>{m.d}</span>
          <span className={s.matNum} style={{ color: 'var(--text3)' }}>{(m.q || 0).toFixed(1)}</span>
          <span className={s.matNum}>{((m.q || 0) / qty).toFixed(2)}</span>
          <span className={s.matNum} style={{ color: 'var(--text3)' }}>${(m.c || 0).toFixed(2)}</span>
          <span className={s.matNum}>${((m.c || 0) / qty).toFixed(2)}</span>
        </div>
      ))}
      <div className={s.matsTotal}>
        <span>Total material cost</span>
        <span className={s.matsTotalVal}>${totalCost.toFixed(2)}</span>
        <span className={s.matsSep}></span>
        <span>per unit</span>
        <span className={s.matsTotalUnit}>${(totalCost / qty).toFixed(2)}</span>
      </div>
    </div>
  );
}

function WORow({ wo, expanded, onToggle }) {
  const [tab, setTab] = useState('hours');
  const qty = wo.q || 1;
  const status = (wo.s || '').toUpperCase();
  const isClosed = status === 'C';
  const isOpen = !status || status === 'O';
  const matCost = (wo.mats || []).reduce((sum, m) => sum + (m.c || 0), 0);

  return (
    <div className={s.woCard}>
      <div className={s.woRow} onClick={onToggle}>
        <span className={`${s.status} ${isClosed ? s.statusClosed : isOpen ? s.statusOpen : s.statusRel}`}>
          {isClosed ? 'Closed' : isOpen ? 'Open' : 'Released'}
        </span>
        <span className={s.woId}>{wo.id}</span>
        <span className={s.woDate}>{formatDate(wo.d)}</span>
        <span className={`${s.woNum} ${s.woQty}`}>{qty}</span>
        <span className={`${s.woNum} ${s.woEst}`}>{wo.e > 0 ? f2(wo.e) : '—'}</span>
        <span className={`${s.woNum} ${s.woAct}`}>{f2(wo.h)}</span>
        <span className={`${s.woNum} ${s.woUnit}`}>{f2(wo.h / qty)}</span>
        <span className={`${s.woNum} ${s.woMat}`}>{matCost > 0 ? `$${Math.round(matCost).toLocaleString()}` : '—'}</span>
        <button className={s.woToggle} type="button">{expanded ? '−' : '+'}</button>
      </div>

      {expanded && (
        <div className={s.woDetail}>
          {qty > 1 && (
            <div className={s.qtyBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span>Qty produced: <strong>{qty} units</strong> · per-unit values calculated on this quantity</span>
            </div>
          )}

          <div className={s.detailTabs}>
            <button
              className={`${s.dtab} ${tab === 'hours' ? s.dtabActive : ''}`}
              onClick={() => setTab('hours')}
            >
              Hours ({(wo.ops || []).length})
            </button>
            <button
              className={`${s.dtab} ${tab === 'mats' ? s.dtabActive : ''}`}
              onClick={() => setTab('mats')}
            >
              Materials ({(wo.mats || []).length})
            </button>
          </div>

          {tab === 'hours' ? <HoursTab wo={wo} /> : <MaterialsTab wo={wo} />}
        </div>
      )}
    </div>
  );
}

function PartCard({ part }) {
  const [open, setOpen] = useState(true);
  const [expandedWO, setExpandedWO] = useState(null);

  const wos = part.wos || [];
  const totalHrs = wos.reduce((sum, w) => sum + (w.h || 0), 0);
  const matCount = wos.reduce((sum, w) => sum + ((w.mats || []).length), 0);

  return (
    <div className={s.card}>
      <div className={s.cardRow} onClick={() => setOpen(!open)}>
        <span className={`${s.shopPill} ${part.shop === 'Wood' ? s.shopWood : s.shopMetal}`}>
          {part.shop || 'Metal'}
        </span>
        <span className={s.partnum}>{part.part_num}</span>
        <span className={s.partName}>{part.description || '—'}</span>
        <div className={s.metaGroup}>
          {matCount > 0 && <span className={s.bomPill}>BOM</span>}
          <div className={s.metaItem}>
            <span className={s.metaLbl}>WOs</span>
            <span className={s.metaVal}>{wos.length}</span>
          </div>
          <div className={s.metaItem}>
            <span className={s.metaLbl}>Total hours</span>
            <span className={s.metaVal}>{f2(totalHrs)} h</span>
          </div>
          <svg className={`${s.chevron} ${open ? s.chevronOpen : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className={s.wosWrap}>
          <div className={s.wosLabel}>
            <span>Work Orders</span>
            <span className={s.wosHint}>click row to expand</span>
          </div>
          <div className={s.woTableHead}>
            <span>Status</span>
            <span>WO ID</span>
            <span>Date</span>
            <span>Qty</span>
            <span>Est.</span>
            <span>Actual</span>
            <span>/unit</span>
            <span>Material</span>
            <span></span>
          </div>
          {wos.map((wo, i) => (
            <WORow
              key={i}
              wo={wo}
              expanded={expandedWO === i}
              onToggle={() => setExpandedWO(expandedWO === i ? null : i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistorySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closedOnly, setClosedOnly] = useState(false);

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/history/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults(data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const filtered = closedOnly
    ? results.map(p => ({ ...p, wos: (p.wos || []).filter(w => (w.s || '').toUpperCase() === 'C') }))
              .filter(p => p.wos.length > 0)
    : results;

  return (
    <div className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Infor History</h1>
        <p className={s.pageSub}>16,263 parts · 47,514 work orders · estimated vs actual hours</p>
      </div>

      <div className={s.search}>
        <svg className={s.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part number or description..."
          autoFocus
        />
      </div>

      <div className={s.filters}>
        <label className={s.toggle}>
          <input
            type="checkbox"
            checked={closedOnly}
            onChange={(e) => setClosedOnly(e.target.checked)}
            style={{ display: 'none' }}
          />
          <div className={`${s.toggleTrack} ${closedOnly ? s.toggleOn : ''}`}>
            <div className={s.toggleThumb}></div>
          </div>
          <span className={s.toggleLabel}>Closed WOs only</span>
        </label>
        <span className={s.resultsCount}>
          {loading ? 'searching...' : query.length < 2 ? 'type at least 2 characters' : `${filtered.length} part${filtered.length !== 1 ? 's' : ''} found`}
        </span>
      </div>

      <div className={s.list}>
        {filtered.map((part, i) => (
          <PartCard key={`${part.part_num}-${i}`} part={part} />
        ))}
      </div>
    </div>
  );
}
