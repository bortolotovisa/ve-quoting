import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './QuoteList.module.css'

export default function QuoteList() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const nav = useNavigate()

  useEffect(() => { fetchQuotes() }, [])

  async function fetchQuotes() {
    try {
      const r = await fetch('/api/quotes')
      setQuotes(await r.json())
    } finally { setLoading(false) }
  }

  async function deleteQuote(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this quote?')) return
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    setQuotes(q => q.filter(x => x.id !== id))
  }

  function fmt(iso) {
    return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? quotes.filter(x =>
        x.name?.toLowerCase().includes(q) ||
        x.client?.toLowerCase().includes(q)
      )
    : quotes

  // Extract unique clients for quick filter chips
  const clients = [...new Set(quotes.map(x => x.client).filter(Boolean))].sort()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logoBlock}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>VE</div>
            <span className={styles.logoText}>Quoting</span>
          </div>
          <span className={styles.sub}>Labour estimator · 47,514 real WOs · 16,263 parts</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnHistory} onClick={() => nav('/history')}>Infor history</button>
          <button className={styles.btnHistory} onClick={() => nav('/materials')}>Materials</button>
          <button className={styles.btnNew} onClick={() => nav('/quote/new')}>+ New quote</button>
        </div>
      </div>

      {!loading && quotes.length > 0 && (
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by quote name or client..."
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>×</button>
          )}
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className={styles.clientChips}>
          {clients.map(c => (
            <button
              key={c}
              className={`${styles.chip} ${search === c ? styles.chipActive : ''}`}
              onClick={() => setSearch(search === c ? '' : c)}
            >{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={styles.empty}>Loading...</div>
      ) : quotes.length === 0 ? (
        <div className={styles.empty}>
          <p>No quotes yet</p>
          <button className={styles.btnNew} onClick={() => nav('/quote/new')}>Create your first quote</button>
        </div>
      ) : (
        <>
          <p className={styles.sectionLabel}>
            {filtered.length} quote{filtered.length !== 1 ? 's' : ''}
            {q ? ` matching "${search}"` : ''}
          </p>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No quotes found for "{search}"</p>
              <button className={styles.btnHistory} onClick={() => setSearch('')}>Clear filter</button>
            </div>
          ) : (
            <div className={styles.list}>
              {filtered.map(q => (
                <div key={q.id} className={styles.row} onClick={() => nav(`/quote/${q.id}`)}>
                  <div className={styles.rowLeft}>
                    <span className={styles.rowName}>{q.name}</span>
                    {q.client && <span className={styles.rowClient}>{q.client}</span>}
                  </div>
                  <div className={styles.rowMeta}>
                    <span className={styles.rowItems}>{q.item_count} item{q.item_count !== 1 ? 's' : ''}</span>
                    <span className={styles.rowHrs}>{parseFloat(q.total_hours).toFixed(1)} h</span>
                    <span className={styles.rowDate}>{fmt(q.updated_at)}</span>
                    <button className={styles.btnDel} onClick={e => deleteQuote(e, q.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
