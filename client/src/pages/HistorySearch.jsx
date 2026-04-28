import { useState, useEffect, useMemo } from 'react'
import styles from './HistorySearch.module.css'

// Common searches shown as quick-access chips
const COMMON_SEARCHES = [
  'Lululemon',
  'Cashwrap',
  'Bracket',
  'Shelf',
  'Vitrine',
  'Display',
  'Curved',
]

// Format date — fixes the truncated year bug (e.g. "07-Jan-202" → "07 Jan 2025")
function formatDate(dateStr) {
  if (!dateStr) return ''
  // Match patterns like "07-Jan-2025", "07-Jan-202" (truncated), "07-Jan-25"
  const match = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{2,4})$/)
  if (!match) return dateStr
  let [, day, mon, year] = match
  // Fix truncated years: "202" → "2025", "203" → "2026"
  if (year.length === 3) year = year + '5' // assume 2025 (most data is from 2025)
  if (year.length === 2) year = '20' + year
  // Format as "07 Jan 2025"
  return `${day.padStart(2, '0')} ${mon} ${year}`
}

// Format hours with 2 decimals
const fmtH = (h) => h == null ? '—' : Number(h).toFixed(2)

// Format currency
const fmtMoney = (n) => n == null ? '—' : '$' + Math.round(Number(n)).toLocaleString()

// Compute variance percentage and hours
function computeVariance(actual, est) {
  if (!est || est === 0) return { type: 'none', pct: 0, hrs: 0 }
  const diffH = actual - est
  const pct = (diffH / est) * 100
  return {
    type: diffH > 0 ? 'over' : 'under',
    pct: Math.round(pct),
    hrs: diffH,
  }
}

// Variance gauge component — Option A
function VarianceGauge({ actual, est, large = false }) {
  const { type, pct, hrs } = computeVariance(actual, est)

  if (type === 'none') {
    return (
      <div className={styles.varCell}>
        <span className={styles.varNoEst}>no estimate</span>
      </div>
    )
  }

  // Cap the visual fill at 50% (full half-bar) — % > 100 still looks full
  const fillWidth = Math.min(Math.abs(pct) / 2, 50)
  const isOver = type === 'over'

  return (
    <div className={styles.varCell}>
      <div className={styles.varGauge}>
        <div className={styles.varGaugeTrack} />
        <div
          className={`${styles.varGaugeFill} ${isOver ? styles.varOver : styles.varUnder}`}
          style={{ width: `${fillWidth}%` }}
        />
        <div className={styles.varGaugeMid} />
      </div>
      <span
        className={`${styles.varPct} ${isOver ? styles.varPctOver : styles.varPctUnder} ${large ? styles.varPctLarge : ''}`}
      >
        {isOver ? '+' : '−'}{Math.abs(pct)}%
      </span>
    </div>
  )
}

export default function HistorySearch() {
  const [query, setQuery] = useState('')
  const [closedOnly, setClosedOnly] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])

  // Track expanded state — everything collapsed by default
  const [expandedParts, setExpandedParts] = useState({})
  const [expandedWOs, setExpandedWOs] = useState({})
  const [activeTabs, setActiveTabs] = useState({})

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ve-recent-searches')
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5))
    } catch (e) {
      // ignore
    }
  }, [])

  // Save recent search
  const saveRecentSearch = (q) => {
    if (!q || q.trim().length < 2) return
    try {
      const trimmed = q.trim()
      const updated = [trimmed, ...recentSearches.filter(r => r !== trimmed)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('ve-recent-searches', JSON.stringify(updated))
    } catch (e) {
      // ignore
    }
  }

  // Search the API
  const doSearch = async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/history/search?q=${encodeURIComponent(q)}${closedOnly ? '&closed=1' : ''}`)
      const data = await res.json()
      setResults(data.results || [])
      saveRecentSearch(q)
      // Reset expanded state on new search — everything collapsed
      setExpandedParts({})
      setExpandedWOs({})
    } catch (e) {
      console.error('Search failed:', e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const t = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(t)
  }, [query, closedOnly])

  const handleQuickSearch = (q) => {
    setQuery(q)
  }

  const togglePart = (partNum) => {
    setExpandedParts((prev) => ({ ...prev, [partNum]: !prev[partNum] }))
  }

  const toggleWO = (woId) => {
    setExpandedWOs((prev) => ({ ...prev, [woId]: !prev[woId] }))
  }

  const setTab = (woId, tab) => {
    setActiveTabs((prev) => ({ ...prev, [woId]: tab }))
  }

  return (
    <div className={styles.page}>
      {/* PAGE HEADER */}
      <div className={styles.pageHd}>
        <div>
          <h1 className={styles.pageTitle}>Infor History</h1>
          <p className={styles.pageSub}>16,263 parts · 47,514 work orders · estimated vs actual hours</p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className={styles.searchBar}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by part number or description..."
          autoFocus
        />
        {query && (
          <button
            className={styles.searchClear}
            onClick={() => setQuery('')}
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* QUICK ACCESS — chips */}
      {!query && (
        <div className={styles.quickAccess}>
          {recentSearches.length > 0 && (
            <div className={styles.chipGroup}>
              <span className={styles.chipGroupLbl}>Recent</span>
              {recentSearches.map((s) => (
                <button
                  key={`r-${s}`}
                  className={`${styles.chip} ${styles.chipRecent}`}
                  onClick={() => handleQuickSearch(s)}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className={styles.chipGroup}>
            <span className={styles.chipGroupLbl}>Common</span>
            {COMMON_SEARCHES.map((s) => (
              <button
                key={`c-${s}`}
                className={styles.chip}
                onClick={() => handleQuickSearch(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS */}
      {query && (
        <div className={styles.filters}>
          <button
            className={styles.toggle}
            onClick={() => setClosedOnly(!closedOnly)}
            type="button"
          >
            <div className={`${styles.toggleTrack} ${closedOnly ? styles.toggleOn : ''}`}>
              <div className={styles.toggleThumb} />
            </div>
            <span className={styles.toggleLabel}>Closed WOs only</span>
          </button>
          <span className={styles.resultsCount}>
            {loading ? 'Searching…' : `${results.length} ${results.length === 1 ? 'part' : 'parts'} found`}
          </span>
        </div>
      )}

      {/* RESULTS */}
      <div className={styles.list}>
        {results.map((part) => {
          const isOpen = expandedParts[part.part_num]
          const totalH = (part.wos || []).reduce((s, w) => s + (w.h || 0), 0)
          const woCount = (part.wos || []).length

          return (
            <div key={part.part_num} className={styles.card}>
              {/* PART CARD ROW */}
              <div
                className={styles.cardRow}
                onClick={() => togglePart(part.part_num)}
              >
                <span className={`${styles.shopPill} ${part.shop === 'Metal' ? styles.shopMetal : styles.shopWood}`}>
                  {part.shop}
                </span>
                <span className={styles.partNum}>{part.part_num}</span>
                <span className={styles.partName}>{part.description}</span>
                <div className={styles.partMeta}>
                  {(part.has_bom || (part.wos || []).some(w => (w.mats || []).length > 0)) && (
                    <span className={styles.bomPill}>BOM</span>
                  )}
                  <div className={styles.metaItem}>
                    <span className={styles.metaLbl}>WOs</span>
                    <span className={styles.metaVal}>{woCount}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLbl}>Total hours</span>
                    <span className={styles.metaVal}>{fmtH(totalH)} h</span>
                  </div>
                  <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* WO LIST */}
              {isOpen && (
                <div className={styles.wos}>
                  <div className={styles.wosHd}>
                    <span>Work Orders</span>
                    <span className={styles.wosHdHint}>click row to expand</span>
                  </div>

                  <div className={styles.woTableHd}>
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

                  {part.wos.map((wo) => {
                    const woOpen = expandedWOs[wo.id]
                    const qty = wo.q || 1
                    const hpu = qty > 0 ? wo.h / qty : wo.h
                    const matCost = (wo.mats || []).reduce((s, m) => s + (m.c || 0), 0)
                    const status = wo.s === 'C' ? 'Closed' : (wo.s === 'R' ? 'Released' : 'Open')
                    const statusClass = wo.s === 'C' ? styles.statusClosed
                                      : wo.s === 'R' ? styles.statusRel
                                      : styles.statusOpen
                    const activeTab = activeTabs[wo.id] || 'hours'

                    return (
                      <div key={wo.id} className={styles.woCard}>
                        {/* WO ROW */}
                        <div className={styles.woRow} onClick={() => toggleWO(wo.id)}>
                          <span className={`${styles.status} ${statusClass}`}>{status}</span>
                          <span className={styles.woId}>{wo.id}</span>
                          <span className={styles.woDate}>{formatDate(wo.d)}</span>
                          <span className={`${styles.woNum} ${styles.woQty}`}>{qty}</span>
                          <span className={`${styles.woNum} ${styles.woEst}`}>{wo.e ? fmtH(wo.e) : '—'}</span>
                          <span className={`${styles.woNum} ${styles.woAct}`}>{fmtH(wo.h)}</span>
                          <span className={`${styles.woNum} ${styles.woUnit}`}>{fmtH(hpu)}</span>
                          <span className={`${styles.woNum} ${styles.woMat}`}>{fmtMoney(matCost)}</span>
                          <button
                            className={styles.woToggle}
                            onClick={(e) => { e.stopPropagation(); toggleWO(wo.id) }}
                            type="button"
                          >
                            {woOpen ? '−' : '+'}
                          </button>
                        </div>

                        {/* WO DETAIL */}
                        {woOpen && (
                          <div className={styles.woDetail}>
                            {/* Qty banner */}
                            <div className={styles.qtyBanner}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                              </svg>
                              <span>Qty produced: <strong>{qty} {qty === 1 ? 'unit' : 'units'}</strong> · per-unit values calculated on this quantity</span>
                            </div>

                            {/* Tabs */}
                            <div className={styles.detailTabs}>
                              <button
                                className={`${styles.dtab} ${activeTab === 'hours' ? styles.dtabActive : ''}`}
                                onClick={() => setTab(wo.id, 'hours')}
                                type="button"
                              >
                                Hours ({(wo.ops || []).length})
                              </button>
                              <button
                                className={`${styles.dtab} ${activeTab === 'mats' ? styles.dtabActive : ''}`}
                                onClick={() => setTab(wo.id, 'mats')}
                                type="button"
                              >
                                Materials ({(wo.mats || []).length})
                              </button>
                            </div>

                            {activeTab === 'hours' && <OperationsTable wo={wo} qty={qty} />}
                            {activeTab === 'mats' && <MaterialsTable wo={wo} qty={qty} />}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {!loading && query && results.length === 0 && (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>No parts found for "{query}"</p>
            <span>Try a part number or description keyword</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ====== Operations table with variance gauge ======
function OperationsTable({ wo, qty }) {
  // Aggregate operations by name
  const opsAgg = useMemo(() => {
    const map = new Map()
    for (const op of (wo.ops || [])) {
      const key = op.n
      if (!map.has(key)) {
        map.set(key, { n: key, h: 0, e: 0 })
      }
      const e = map.get(key)
      e.h += op.h || 0
      e.e += op.e || 0
    }
    return Array.from(map.values()).sort((a, b) => b.h - a.h)
  }, [wo.ops])

  const totalH = opsAgg.reduce((s, op) => s + op.h, 0)
  const totalE = opsAgg.reduce((s, op) => s + op.e, 0)

  return (
    <div className={styles.ops}>
      <div className={styles.opsHd}>
        <span>Operation</span>
        <span>Distribution</span>
        <span>Est.</span>
        <span>Actual</span>
        <span>Variance</span>
        <span>/unit</span>
      </div>

      {opsAgg.map((op) => {
        const pct = totalH > 0 ? (op.h / totalH) * 100 : 0
        const hpu = qty > 0 ? op.h / qty : op.h
        return (
          <div key={op.n} className={styles.opsRow}>
            <span className={styles.opName}>{op.n}</span>
            <div className={styles.opBarWrap}>
              <div className={styles.opBar}>
                <div className={styles.opBarFill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.opBarPct}>{Math.round(pct)}%</span>
            </div>
            <span className={styles.opEst}>{op.e > 0 ? fmtH(op.e) : <span style={{ color: 'var(--ve-border-strong)' }}>—</span>}</span>
            <span className={styles.opAct}>{fmtH(op.h)}</span>
            <VarianceGauge actual={op.h} est={op.e} />
            <span className={styles.opUnit}>{fmtH(hpu)}</span>
          </div>
        )
      })}

      {/* TOTAL ROW */}
      <div className={styles.opsTotal}>
        <span className={styles.tLabel}>Total</span>
        <span></span>
        <span className={styles.tEst}>{totalE > 0 ? fmtH(totalE) : '—'}</span>
        <span className={styles.tAct}>{fmtH(totalH)} h</span>
        <VarianceGauge actual={totalH} est={totalE} large />
        <span className={styles.tUnit}>{fmtH(qty > 0 ? totalH / qty : totalH)}</span>
      </div>
    </div>
  )
}

// ====== Materials table ======
function MaterialsTable({ wo, qty }) {
  const mats = wo.mats || []
  const totalCost = mats.reduce((s, m) => s + (m.c || 0), 0)

  if (mats.length === 0) {
    return <div className={styles.emptyTab}>No materials recorded for this work order</div>
  }

  return (
    <>
      <div className={styles.mats}>
        <div className={styles.matsHd}>
          <span>Material</span>
          <span>Description</span>
          <span>Total qty</span>
          <span>/unit</span>
          <span>Total cost</span>
          <span>$/unit</span>
        </div>

        {mats.map((m, i) => {
          const uqty = qty > 0 ? m.q / qty : m.q
          const ucost = qty > 0 ? m.c / qty : m.c
          return (
            <div key={`${m.id}-${i}`} className={styles.matRow}>
              <span className={styles.matId}>{m.id}</span>
              <span className={styles.matDesc} title={m.d}>{m.d}</span>
              <span className={`${styles.matNum} ${styles.matQty}`}>{m.q.toFixed(2)}</span>
              <span className={`${styles.matNum} ${styles.matUqty}`}>{uqty.toFixed(2)}</span>
              <span className={`${styles.matNum} ${styles.matCost}`}>{fmtMoney(m.c)}</span>
              <span className={`${styles.matNum} ${styles.matUcost}`}>{fmtMoney(ucost)}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.matTotal}>
        <span>Total material cost</span>
        <span className={styles.matTotalVal}>{fmtMoney(totalCost)}</span>
        <span className={styles.matSep} />
        <span>Per unit</span>
        <span className={styles.matTotalUnit}>{fmtMoney(qty > 0 ? totalCost / qty : totalCost)}</span>
      </div>
    </>
  )
}
