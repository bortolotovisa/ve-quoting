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
        <p className={styles.sub}>16,263 parts · real hours + materials · search by part number or description</p>
      </div>
      <div className={styles.searchWrap}>
        <input className={styles.searchInput} value={query} onChange={handleInput}
          placeholder="Part number or description — e.g. 50-1378 or curved rack..." autoFocus />
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
  const [tab, setTab] = useState('hours')
  const isWood = item.shop === 'Wood'
  const ops = Array.isArray(item.operations) ? item.operations : JSON.parse(item.operations || '[]')
  const mats = Array.isArray(item.materials) ? item.materials : JSON.parse(item.materials || '[]')
  const wos = Array.isArray(item.wos) ? item.wos : JSON.parse(item.wos || '[]')
  const sortedOps = [...ops].sort((a, b) => b.act_hrs - a.act_hrs)
  const sortedMats = [...mats].sort((a, b) => b.avg_cost - a.avg_cost)
  const totalHrs = parseFloat(item.total_hrs)
  const hasMats = sortedMats.length > 0
  const hasWos = wos.length > 0

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
          {/* WO details section */}
          {hasWos && wos.length > 0 && (
            <div className={styles.woSection}>
              <div className={styles.woSectionTitle}>Work orders</div>
              {wos.map((wo, i) => (
                <div key={i} className={styles.woRow}>
                  <span className={`${styles.woStatus} ${wo.s === 'C' ? styles.woClosed : wo.s === 'R' ? styles.woReleased : styles.woOther}`}>
                    {wo.s === 'C' ? 'Closed' : wo.s === 'R' ? 'Released' : 'Open'}
                  </span>
                  <span className={styles.woId}>{wo.id}</span>
                  <span className={styles.woDate}>{wo.d || '—'}</span>
                  <span className={styles.woHrs}>{wo.h.toFixed(1)} h</span>
                  <span className={styles.woMat}>${wo.m.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className={styles.detailTabs}>
            <button className={`${styles.dtab} ${tab === 'hours' ? styles.dtabActive : ''}`} onClick={() => setTab('hours')}>
              Hours ({sortedOps.length})
            </button>
            {hasMats && (
              <button className={`${styles.dtab} ${tab === 'materials' ? styles.dtabActive : ''}`} onClick={() => setTab('materials')}>
                Materials ({sortedMats.length})
              </button>
            )}
          </div>

          {tab === 'hours' && sortedOps.map((op, i) => {
            const pct = totalHrs > 0 ? (op.act_hrs / totalHrs) * 100 : 0
            return (
              <div key={i} className={styles.opRow}>
                <span className={styles.opName}>{op.operation}</span>
                <div className={styles.opBarWrap}>
                  <div className={`${styles.opBar} ${isWood ? styles.barWood : styles.barMetal}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
                <span className={styles.opHrs}>{op.act_hrs.toFixed(1)} h</span>
              </div>
            )
          })}

          {tab === 'materials' && (
            <div className={styles.matList}>
              <div className={styles.matHeader}>
                <span className={styles.matColId}>Part ID</span>
                <span className={styles.matColDesc}>Description</span>
                <span className={styles.matColQty}>Avg qty</span>
                <span className={styles.matColCost}>Avg cost</span>
              </div>
              {sortedMats.map((m, i) => (
                <div key={i} className={styles.matRow}>
                  <span className={styles.matId}>{m.part_id}</span>
                  <span className={styles.matDesc}>{m.desc}</span>
                  <span className={styles.matQty}>{m.avg_qty}</span>
                  <span className={styles.matCost}>${m.avg_cost.toFixed(2)}</span>
                </div>
              ))}
              <div className={styles.matTotal}>
                Total avg material cost: ${sortedMats.reduce((s, m) => s + m.avg_cost, 0).toFixed(2)}
              </div>
            </div>
          )}

          <p className={styles.opNote}>
            Real data from Infor · {tab === 'hours' ? 'actual run hours (aggregated across all WOs)' : 'actual material usage'}
          </p>
        </div>
      )}
    </div>
  )
}
