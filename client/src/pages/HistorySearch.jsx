import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './HistorySearch.module.css'

function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export default function HistorySearch() {
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(debounce(async (q) => {
    if (!q || q.length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/history/search?q=${encodeURIComponent(q)}`)
      setResults(await r.json())
      setSearched(true)
    } finally { setLoading(false) }
  }, 350), [])

  function handleInput(e) { setQuery(e.target.value); doSearch(e.target.value) }
  function quickSearch(t) { setQuery(t); doSearch(t) }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => nav('/')}>← All quotes</button>
      </div>
      <div className={styles.header}>
        <div className={styles.title}>Infor history</div>
        <p className={styles.sub}>16,263 parts · click a WO to see total and per-unit breakdown</p>
      </div>
      <div className={styles.searchWrap}>
        <input className={styles.searchInput} value={query} onChange={handleInput}
          placeholder="Part number or description — e.g. 108630 or curved rack..." autoFocus />
        {loading && <div className={styles.spinner} />}
      </div>
      {searched && results.length === 0 && <div className={styles.empty}>No parts found for "{query}"</div>}
      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((item, i) => <ResultCard key={i} item={item} />)}
          {results.length === 30 && <p className={styles.hint}>Showing top 30 — refine your search</p>}
        </div>
      )}
      {!searched && !loading && (
        <div className={styles.placeholder}>
          <p>Type at least 2 characters to search</p>
          <p className={styles.examplesLabel}>Try:</p>
          <div className={styles.examples}>
            {['50-1378','display table','108630','gondola','faceout','shelf','bench','nesting'].map(t => (
              <span key={t} className={styles.exampleChip} onClick={() => quickSearch(t)}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({ item }) {
  const [open, setOpen] = useState(false)
  const isWood = item.shop === 'Wood'
  const wos = Array.isArray(item.wos) ? item.wos : JSON.parse(item.wos || '[]')
  const totalHrs = parseFloat(item.total_hrs)
  const hasMats = wos.some(w => w.mats && w.mats.length > 0)

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.cardLeft}>
          <span className={`${styles.shopBadge} ${isWood ? styles.wood : styles.metal}`}>{item.shop}</span>
          <span className={styles.partNum}>{item.part_num}</span>
          <span className={styles.partDesc}>{item.description}</span>
        </div>
        <div className={styles.cardRight}>
          {hasMats && <span className={styles.matBadge}>BOM</span>}
          <span className={styles.woCount}>{item.wo_count || 1} WO{(item.wo_count||1) !== 1 ? 's' : ''}</span>
          <span className={styles.totalHrs}>{totalHrs.toFixed(1)} h</span>
          <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className={styles.opsBlock}>
          <div className={styles.woSectionTitle}>Work orders — click to expand</div>
          <div className={styles.woListHeader}>
            <span className={styles.woColStatus}>Status</span>
            <span className={styles.woColId}>WO</span>
            <span className={styles.woColDate}>Date</span>
            <span className={styles.woColQty}>Qty</span>
            <span className={styles.woColTotal}>Total</span>
            <span className={styles.woColUnit}>/unit</span>
            <span className={styles.woColMat}>Material</span>
            <span style={{width:20}} />
          </div>
          {wos.map((wo, i) => <WORow key={i} wo={wo} isWood={isWood} />)}
        </div>
      )}
    </div>
  )
}

function WORow({ wo, isWood }) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState('hours')
  const ops = wo.ops || []
  const mats = wo.mats || []
  const hasMats = mats.length > 0
  const qty = wo.q || 1
  const unitHrs = qty > 0 ? (wo.h / qty) : wo.h
  const unitMat = qty > 0 ? (wo.m / qty) : wo.m

  return (
    <div className={styles.woCard}>
      <div className={styles.woRow} onClick={() => setExpanded(e => !e)}>
        <span className={`${styles.woStatus} ${wo.s === 'C' ? styles.woClosed : wo.s === 'R' ? styles.woReleased : styles.woOther}`}>
          {wo.s === 'C' ? 'Closed' : wo.s === 'R' ? 'Released' : 'Open'}
        </span>
        <span className={styles.woId}>{wo.id}</span>
        <span className={styles.woDate}>{wo.d || '—'}</span>
        <span className={styles.woQty}>{qty}</span>
        <span className={styles.woHrs}>{wo.h.toFixed(1)} h</span>
        <span className={styles.woUnit}>{unitHrs.toFixed(1)} h</span>
        <span className={styles.woMat}>${wo.m.toFixed(0)}</span>
        <span className={styles.woChevron}>{expanded ? '−' : '+'}</span>
      </div>

      {expanded && (
        <div className={styles.woDetail}>
          {qty > 1 && (
            <div className={styles.qtyBanner}>
              This WO produced <strong>{qty} units</strong> — values below show total and per unit
            </div>
          )}

          {hasMats && (
            <div className={styles.detailTabs}>
              <button className={`${styles.dtab} ${tab === 'hours' ? styles.dtabActive : ''}`} onClick={() => setTab('hours')}>
                Hours ({ops.length})
              </button>
              <button className={`${styles.dtab} ${tab === 'materials' ? styles.dtabActive : ''}`} onClick={() => setTab('materials')}>
                Materials ({mats.length})
              </button>
            </div>
          )}

          {tab === 'hours' && ops.length > 0 && (
            <>
              {qty > 1 && (
                <div className={styles.colHeaders}>
                  <span className={styles.colOp}>Operation</span>
                  <span className={styles.colBar} />
                  <span className={styles.colTotal}>Total</span>
                  <span className={styles.colPerUnit}>/unit</span>
                </div>
              )}
              {ops.map((op, i) => {
                const pct = wo.h > 0 ? (op.h / wo.h) * 100 : 0
                const perUnit = qty > 0 ? (op.h / qty) : op.h
                return (
                  <div key={i} className={styles.opRow}>
                    <span className={styles.opName}>{op.n}</span>
                    <div className={styles.opBarWrap}>
                      <div className={`${styles.opBar} ${isWood ? styles.barWood : styles.barMetal}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <span className={styles.opHrs}>{op.h.toFixed(1)} h</span>
                    {qty > 1 && <span className={styles.opPerUnit}>{perUnit.toFixed(1)} h</span>}
                  </div>
                )
              })}
              <div className={styles.opTotalRow}>
                <span className={styles.opTotalLabel}>Total</span>
                <span className={styles.opTotalHrs}>{wo.h.toFixed(1)} h</span>
                {qty > 1 && <span className={styles.opTotalPerUnit}>{unitHrs.toFixed(1)} h/unit</span>}
              </div>
            </>
          )}
          {tab === 'hours' && ops.length === 0 && (
            <div className={styles.noData}>No operation hours recorded</div>
          )}

          {tab === 'materials' && mats.length > 0 && (
            <div className={styles.matList}>
              <div className={styles.matHeader}>
                <span className={styles.matColId}>Part ID</span>
                <span className={styles.matColDesc}>Description</span>
                <span className={styles.matColQty}>{qty > 1 ? 'Total qty' : 'Qty'}</span>
                {qty > 1 && <span className={styles.matColUnit}>/unit</span>}
                <span className={styles.matColCost}>{qty > 1 ? 'Total cost' : 'Cost'}</span>
                {qty > 1 && <span className={styles.matColUnitCost}>/unit</span>}
              </div>
              {mats.map((m, i) => {
                const perUnitQty = qty > 0 ? (m.q / qty) : m.q
                const perUnitCost = qty > 0 ? (m.c / qty) : m.c
                return (
                  <div key={i} className={styles.matRow}>
                    <span className={styles.matId}>{m.id}</span>
                    <span className={styles.matDesc}>{m.d}</span>
                    <span className={styles.matQty}>{m.q}</span>
                    {qty > 1 && <span className={styles.matUnitQty}>{perUnitQty.toFixed(1)}</span>}
                    <span className={styles.matCost}>${m.c.toFixed(2)}</span>
                    {qty > 1 && <span className={styles.matUnitCost}>${perUnitCost.toFixed(2)}</span>}
                  </div>
                )
              })}
              <div className={styles.matTotal}>
                <span>Material total: ${mats.reduce((s, m) => s + m.c, 0).toFixed(2)}</span>
                {qty > 1 && <span className={styles.matTotalUnit}> · ${(mats.reduce((s, m) => s + m.c, 0) / qty).toFixed(2)}/unit</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
