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
        <p className={styles.sub}>2,286 parts · real hours Jan 2025–Mar 2026 · use as reference when quoting</p>
      </div>

      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={handleInput}
          placeholder="Part number or description — e.g. 106828 or midrack..."
          autoFocus
        />
        {loading && <div className={styles.spinner} />}
      </div>

      {searched && results.length === 0 && (
        <div className={styles.empty}>No parts found for "{query}"</div>
      )}

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((item, i) => <ResultCard key={i} item={item} />)}
          {results.length === 30 && (
            <p className={styles.hint}>Showing top 30 — refine your search for more specific results</p>
          )}
        </div>
      )}

      {!searched && !loading && (
        <div className={styles.placeholder}>
          <p>Type at least 2 characters to search</p>
          <p className={styles.examplesLabel}>Try:</p>
          <div className={styles.examples}>
            {['midrack','cashwrap','gondola','faceout','mirror','shelf','platform','showcase'].map(t => (
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
  const ops = Array.isArray(item.operations) ? item.operations : JSON.parse(item.operations || '[]')
  const sortedOps = [...ops].sort((a, b) => b.act_hrs - a.act_hrs)
  const totalHrs = parseFloat(item.total_hrs)

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={() => setOpen(o => !o)}>
        <div className={styles.cardLeft}>
          <span className={`${styles.shopBadge} ${isWood ? styles.wood : styles.metal}`}>{item.shop}</span>
          <span className={styles.partNum}>{item.part_num}</span>
          <span className={styles.partDesc}>{item.description}</span>
        </div>
        <div className={styles.cardRight}>
          <span className={styles.totalHrs}>{totalHrs.toFixed(1)} h</span>
          <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className={styles.opsBlock}>
          {sortedOps.map((op, i) => {
            const pct = totalHrs > 0 ? (op.act_hrs / totalHrs) * 100 : 0
            return (
              <div key={i} className={styles.opRow}>
                <span className={styles.opName}>{op.operation}</span>
                <div className={styles.opBarWrap}>
                  <div className={`${styles.opBar} ${isWood ? styles.barWood : styles.barMetal}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
                <span className={styles.opHrs}>{op.act_hrs.toFixed(1)} h</span>
                <span className={styles.opWos}>{op.wo_count} WO{op.wo_count !== 1 ? 's' : ''}</span>
              </div>
            )
          })}
          <p className={styles.opNote}>Real hours from Infor 2025 · use as reference when building your quote</p>
        </div>
      )}
    </div>
  )
}
