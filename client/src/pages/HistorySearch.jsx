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
  const [closedOnly, setClosedOnly] = useState(false)

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

  const filteredResults = closedOnly
    ? results.map(item => {
        const wos = Array.isArray(item.wos) ? item.wos : JSON.parse(item.wos || '[]')
        const closedWos = wos.filter(w => w.s === 'C')
        const totalHrs = +closedWos.reduce((s, w) => s + (w.h || 0), 0).toFixed(2)
        return { ...item, wos: closedWos, total_hrs: totalHrs, wo_count: closedWos.length }
      }).filter(item => item.wo_count > 0)
    : results

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => nav('/')}>← All quotes</button>
      </div>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.title}>Infor history</div>
            <p className={styles.sub}>16,263 parts · estimated vs actual hours · click a WO for per-unit breakdown</p>
          </div>
          <label className={styles.closedToggle}>
            <input type="checkbox" checked={closedOnly} onChange={e => setClosedOnly(e.target.checked)} className={styles.toggleInput} />
            <span className={`${styles.toggleTrack} ${closedOnly ? styles.toggleOn : ''}`}>
              <span className={styles.toggleThumb} />
            </span>
            <span className={styles.toggleLabel}>Closed WOs only</span>
          </label>
        </div>
      </div>
      <div className={styles.searchWrap}>
        <input className={styles.searchInput} value={query} onChange={handleInput}
          placeholder="Part number or description — e.g. 108630 or curved rack..." autoFocus />
        {loading && <div className={styles.spinner} />}
      </div>
      {searched && filteredResults.length === 0 && (
        <div className={styles.empty}>
          {results.length > 0 && closedOnly
            ? `All WOs for "${query}" are still open — try disabling "Closed only"`
            : `No parts found for "${query}"`}
        </div>
      )}
      {filteredResults.length > 0 && (
        <div className={styles.results}>
          {filteredResults.map((item, i) => <ResultCard key={i} item={item} />)}
          {filteredResults.length === 30 && <p className={styles.hint}>Showing top 30 — refine your search</p>}
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
  const totalEst = parseFloat(item.total_est || 0)
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
          <span className={styles.totalHrs}>{totalHrs.toFixed(2)} h</span>
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
            <span className={styles.woColEst}>Est.</span>
            <span className={styles.woColAct}>Actual</span>
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
  const unitHrs = wo.h / qty
  const unitEst = (wo.e || 0) / qty

  return (
    <div className={styles.woCard}>
      <div className={styles.woRow} onClick={() => setExpanded(e => !e)}>
        <span className={`${styles.woStatus} ${wo.s === 'C' ? styles.woClosed : wo.s === 'R' ? styles.woReleased : styles.woOther}`}>
          {wo.s === 'C' ? 'Closed' : wo.s === 'R' ? 'Released' : 'Open'}
        </span>
        <span className={styles.woId}>{wo.id}</span>
        <span className={styles.woDate}>{wo.d || '—'}</span>
        <span className={styles.woQty}>{qty}</span>
        <span className={styles.woEst}>{(wo.e || 0).toFixed(2)}</span>
        <span className={styles.woAct}>{wo.h.toFixed(2)}</span>
        <span className={styles.woUnit}>{unitHrs.toFixed(2)}</span>
        <span className={styles.woMat}>${wo.m.toFixed(2)}</span>
        <span className={styles.woChevron}>{expanded ? '−' : '+'}</span>
      </div>

      {expanded && (
        <div className={styles.woDetail}>
          {qty > 1 && (
            <div className={styles.qtyBanner}>
              WO quantity: <strong>{qty} units</strong> — per unit values use this qty
              {wo.s !== 'C' && <span className={styles.qtyWarning}> · WO not closed — actual hours may be incomplete</span>}
            </div>
          )}
          {qty === 1 && wo.s !== 'C' && (
            <div className={styles.qtyBanner}>
              <span className={styles.qtyWarning}>WO not closed — actual hours may be incomplete</span>
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
            <div className={styles.opsTable}>
              <div className={styles.opsTableHead}>
                <span className={styles.thOp}>Operation</span>
                <span className={styles.thEst}>Est.</span>
                <span className={styles.thAct}>Actual</span>
                <span className={styles.thVar}>Variance</span>
                {qty > 1 && <span className={styles.thUnit}>/unit</span>}
              </div>
              {ops.map((op, i) => {
                const est = op.e || 0
                const act = op.h
                const diff = act - est
                const pctDiff = est > 0 ? (diff / est) * 100 : null
                const isOver = est > 0 && diff > 0.1
                const isUnder = est > 0 && diff < -0.1
                const hasEst = est > 0
                return (
                  <div key={i} className={`${styles.opsTableRow} ${i % 2 === 0 ? styles.rowEven : ''}`}>
                    <span className={styles.tdOp}>{op.n}</span>
                    <span className={styles.tdEst}>{hasEst ? est.toFixed(2) : <span className={styles.noEst}>—</span>}</span>
                    <span className={styles.tdAct}>{act.toFixed(2)}</span>
                    <span className={`${styles.tdVar} ${isOver ? styles.varOver : isUnder ? styles.varUnder : styles.varNeutral}`}>
                      {!hasEst ? <span className={styles.noEst}>—</span> : (
                        <>
                          <span className={styles.varArrow}>{isOver ? '▲' : isUnder ? '▼' : '='}</span>
                          <span className={styles.varHrs}>{Math.abs(diff).toFixed(2)}h</span>
                          {pctDiff !== null && (
                            <span className={styles.varPct}>{Math.abs(Math.round(pctDiff))}%</span>
                          )}
                        </>
                      )}
                    </span>
                    {qty > 1 && <span className={styles.tdUnit}>{(act / qty).toFixed(2)}</span>}
                  </div>
                )
              })}
              <div className={styles.opsTableFoot}>
                <span className={styles.tdOp}>Total</span>
                <span className={styles.tdEst}>{(wo.e || 0) > 0 ? (wo.e).toFixed(2) : '—'}</span>
                <span className={styles.tdActBold}>{wo.h.toFixed(2)} h</span>
                {(() => {
                  const totalEst = wo.e || 0
                  const totalAct = wo.h
                  const totalDiff = totalAct - totalEst
                  const totalPct = totalEst > 0 ? (totalDiff / totalEst) * 100 : null
                  const isOver = totalEst > 0 && totalDiff > 0.1
                  const isUnder = totalEst > 0 && totalDiff < -0.1
                  return (
                    <span className={`${styles.tdVar} ${isOver ? styles.varOver : isUnder ? styles.varUnder : styles.varNeutral}`}>
                      {totalEst > 0 ? (
                        <>
                          <span className={styles.varArrow}>{isOver ? '▲' : isUnder ? '▼' : '='}</span>
                          <span className={styles.varHrs}>{Math.abs(totalDiff).toFixed(2)}h</span>
                          {totalPct !== null && <span className={styles.varPct}>{Math.abs(Math.round(totalPct))}%</span>}
                        </>
                      ) : '—'}
                    </span>
                  )
                })()}
                {qty > 1 && <span className={styles.tdUnitBold}>{unitHrs.toFixed(2)} h/u</span>}
              </div>
            </div>
          )}
          {tab === 'hours' && ops.length === 0 && <div className={styles.noData}>No operation hours recorded</div>}

          {tab === 'materials' && mats.length > 0 && (
            <div className={styles.matList}>
              <div className={styles.matHeader}>
                <span className={styles.matColId}>Part ID</span>
                <span className={styles.matColDesc}>Description</span>
                <span className={styles.matColQty}>{qty > 1 ? 'Total' : 'Qty'}</span>
                {qty > 1 && <span className={styles.matColUnit}>/unit</span>}
                <span className={styles.matColCost}>{qty > 1 ? 'Total $' : 'Cost'}</span>
                {qty > 1 && <span className={styles.matColUnitCost}>$/unit</span>}
              </div>
              {mats.map((m, i) => (
                <div key={i} className={styles.matRow}>
                  <span className={styles.matId}>{m.id}</span>
                  <span className={styles.matDesc}>{m.d}</span>
                  <span className={styles.matQty}>{m.q}</span>
                  {qty > 1 && <span className={styles.matUnitQty}>{(m.q / qty).toFixed(2)}</span>}
                  <span className={styles.matCost}>${m.c.toFixed(2)}</span>
                  {qty > 1 && <span className={styles.matUnitCost}>${(m.c / qty).toFixed(2)}</span>}
                </div>
              ))}
              <div className={styles.matTotal}>
                <span>Total: ${mats.reduce((s, m) => s + m.c, 0).toFixed(2)}</span>
                {qty > 1 && <span className={styles.matTotalUnit}> · ${(mats.reduce((s, m) => s + m.c, 0) / qty).toFixed(2)}/unit</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
