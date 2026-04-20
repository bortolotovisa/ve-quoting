import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './QuoteList.module.css'

export default function QuoteList() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
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
          <button className={styles.btnHistory} onClick={() => nav('/history')}>
            Infor history
          </button>
          <button className={styles.btnHistory} onClick={() => nav('/materials')}>
            Materials
          </button>
          <button className={styles.btnAI} onClick={() => nav('/drawing-quote')}>
            ✦ AI drawing quote
          </button>
          <button className={styles.btnNew} onClick={() => nav('/quote/new')}>
            + New quote
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading...</div>
      ) : quotes.length === 0 ? (
        <div className={styles.empty}>
          <p>No quotes yet</p>
          <button className={styles.btnNew} onClick={() => nav('/quote/new')}>Create your first quote</button>
        </div>
      ) : (
        <>
          <p className={styles.sectionLabel}>{quotes.length} quote{quotes.length !== 1 ? 's' : ''}</p>
          <div className={styles.list}>
            {quotes.map(q => (
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
        </>
      )}
    </div>
  )
}
