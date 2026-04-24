import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CX, BASE_PROCESSES, ADDON_PROCESSES, defaultProcs, calcItem, calcQuoteTotalHrs } from '../quoteData'
import styles from './QuoteEditor.module.css'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export default function QuoteEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const isNew = !id
  const saveTimer = useRef(null)
  const [quoteId, setQuoteId] = useState(id || null)
  const [name, setName] = useState('New quote')
  const [client, setClient] = useState('')
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => { if (!isNew) loadQuote(); else addItem() }, [])

  async function loadQuote() {
    try {
      const r = await fetch(`/api/quotes/${id}`)
      const q = await r.json()
      setName(q.name); setClient(q.client || ''); setItems(q.items || [])
    } finally { setLoading(false) }
  }

  const autoSave = useCallback((n, c, itms) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(n, c, itms), 900)
  }, [quoteId])

  async function save(n, c, itms) {
    setSaving(true)
    const body = { name: n, client: c, items: itms, total_hours: calcQuoteTotalHrs(itms) }
    if (!quoteId) {
      const r = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const { id: newId } = await r.json()
      setQuoteId(newId)
      window.history.replaceState(null, '', `/quote/${newId}`)
    } else {
      await fetch(`/api/quotes/${quoteId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function update(n, c, itms) { setName(n); setClient(c); setItems(itms); autoSave(n, c, itms) }
  function addItem() {
    const shop = 'metal'
    update(name, client, [...items, { id: uid(), desc: '', partNum: '', qty: 1, shop, procs: defaultProcs(shop), addons: {} }])
  }
  function removeItem(iid) { update(name, client, items.filter(i => i.id !== iid)) }
  function patch(iid, p) { update(name, client, items.map(i => i.id === iid ? { ...i, ...p } : i)) }
  function setShop(iid, shop) { patch(iid, { shop, procs: defaultProcs(shop), addons: {} }) }
  function toggleProc(iid, pid) {
    const item = items.find(i => i.id === iid)
    patch(iid, { procs: { ...item.procs, [pid]: { ...item.procs[pid], on: !item.procs[pid].on } } })
  }
  function setProcCx(iid, pid, cx) {
    const item = items.find(i => i.id === iid)
    patch(iid, { procs: { ...item.procs, [pid]: { ...item.procs[pid], cx } } })
  }
  function toggleAddon(iid, aid) {
    const item = items.find(i => i.id === iid)
    const addons = { ...item.addons }
    addons[aid] ? delete addons[aid] : addons[aid] = { on: true, cx: 'M' }
    patch(iid, { addons })
  }
  function setAddonCx(iid, aid, cx) {
    const item = items.find(i => i.id === iid)
    patch(iid, { addons: { ...item.addons, [aid]: { ...item.addons[aid], cx } } })
  }

  const totalHrs = calcQuoteTotalHrs(items)
  if (loading) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => nav('/')}>← All quotes</button>
        <div className={styles.saveStatus}>
          {saving ? <span className={styles.saving}>Saving...</span> : saved ? <span className={styles.saved}>Saved ✓</span> : null}
        </div>
      </div>

      <div className={styles.quoteHeader}>
        <div className={styles.headerLeft}>
          <input className={styles.nameInput} value={name} onChange={e => update(e.target.value, client, items)} placeholder="Quote name" />
          <input className={styles.clientInput} value={client} onChange={e => update(name, e.target.value, items)} placeholder="Client (optional)" />
        </div>
        <div className={styles.headerRight}>
          <div className={styles.totalBlock}>
            <span className={styles.totalLabel}>Total labour</span>
            <span className={styles.totalHrs}>{totalHrs.toFixed(1)}<span className={styles.totalUnit}>h</span></span>
          </div>
          <button className={styles.addBtn} onClick={addItem}>+ Add item</button>
        </div>
      </div>

      <div className={styles.items}>
        {items.length === 0 && (
          <div className={styles.emptyItems}>
            <p>No items yet.</p>
            <button className={styles.addBtn} onClick={addItem}>+ Add first item</button>
          </div>
        )}
        {items.map((item, idx) => (
          <ItemCard key={item.id} item={item} idx={idx}
            onRemove={() => removeItem(item.id)}
            onDesc={v => patch(item.id, { desc: v })}
            onPart={v => patch(item.id, { partNum: v })}
            onQty={v => patch(item.id, { qty: Math.max(1, parseInt(v) || 1) })}
            onShop={s => setShop(item.id, s)}
            onToggleProc={pid => toggleProc(item.id, pid)}
            onProcCx={(pid, cx) => setProcCx(item.id, pid, cx)}
            onToggleAddon={aid => toggleAddon(item.id, aid)}
            onAddonCx={(aid, cx) => setAddonCx(item.id, aid, cx)}
          />
        ))}
      </div>

      {totalHrs > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryTitle}>Summary</div>
          {items.map((item, idx) => {
            const { totalHrs: ih } = calcItem(item)
            if (!ih) return null
            const lh = +(ih * item.qty).toFixed(1)
            return (
              <div key={item.id} className={styles.sumRow}>
                <span className={`${styles.shopDot} ${item.shop === 'metal' ? styles.dotMetal : styles.dotWood}`} />
                <span className={styles.sumDesc}>{item.desc || `Item ${idx + 1}`}{item.qty > 1 ? ` ×${item.qty}` : ''}</span>
                <span className={styles.sumInfo}>{ih.toFixed(2)}h/unit</span>
                <span className={styles.sumHrs}>{lh.toFixed(2)} h</span>
              </div>
            )
          })}
          <div className={styles.shopBreakdown}>
            {(() => {
              const metalHrs = +items.reduce((s, item) => {
                if (item.shop !== 'metal') return s
                const { totalHrs: ih } = calcItem(item)
                return s + ih * (item.qty || 1)
              }, 0).toFixed(2)
              const woodHrs = +items.reduce((s, item) => {
                if (item.shop !== 'wood') return s
                const { totalHrs: ih } = calcItem(item)
                return s + ih * (item.qty || 1)
              }, 0).toFixed(2)
              return (
                <>
                  {metalHrs > 0 && (
                    <div className={styles.shopLine}>
                      <span className={`${styles.shopDot} ${styles.dotMetal}`} />
                      <span className={styles.shopName}>Metal shop</span>
                      <span className={styles.shopHrs}>{metalHrs.toFixed(2)} h</span>
                    </div>
                  )}
                  {woodHrs > 0 && (
                    <div className={styles.shopLine}>
                      <span className={`${styles.shopDot} ${styles.dotWood}`} />
                      <span className={styles.shopName}>Wood shop</span>
                      <span className={styles.shopHrs}>{woodHrs.toFixed(2)} h</span>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
          <div className={styles.sumTotal}>
            <span>Total labour estimated</span>
            <span className={styles.totalHrs}>{totalHrs.toFixed(2)} h</span>
          </div>
          <p className={styles.sumNote}>+ material cost (external) · apply Infor rates to these hours</p>
        </div>
      )}
    </div>
  )
}

function ProcRow({ proc, state, shop, isAddon, onToggle, onCx }) {
  const on = state?.on
  const cx = state?.cx || 'M'
  const isWood = shop === 'wood'
  const activeClass = on ? (isAddon ? styles.addonOn : isWood ? styles.woodOn : styles.metalOn) : styles.removed

  return (
    <div className={`${styles.procRow} ${activeClass}`}>
      <span className={styles.procName}>{proc.name}</span>
      {on && <span className={styles.procAwo}>{proc.awo}h</span>}
      {on && (
        <div className={styles.cxPills}>
          {['S', 'M', 'C'].map(c => (
            <button key={c} className={`${styles.cxPill} ${on && cx === c ? styles['cx' + c] : ''}`} onClick={() => onCx(c)}>{c}</button>
          ))}
        </div>
      )}
      <button className={on ? styles.removeBtn : styles.addBackBtn} onClick={onToggle}>
        {on ? 'Remove' : '+ Add back'}
      </button>
    </div>
  )
}

function ItemCard({ item, idx, onRemove, onDesc, onPart, onQty, onShop, onToggleProc, onProcCx, onToggleAddon, onAddonCx }) {
  const calc = calcItem(item)
  const baseProcs = BASE_PROCESSES[item.shop] || []
  const addonProcs = ADDON_PROCESSES[item.shop] || []
  const removedCount = baseProcs.filter(p => !item.procs?.[p.id]?.on).length

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.itemNum}>Item {idx + 1}</span>
        <button className={styles.removeItemBtn} onClick={onRemove}>Remove item</button>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldDesc}>
          <label className={styles.lbl}>Description</label>
          <input value={item.desc} onChange={e => onDesc(e.target.value)} placeholder="Ex: Midrack metal, Cashwrap wood..." />
        </div>
        <div>
          <label className={styles.lbl}>Part # (optional)</label>
          <input value={item.partNum} onChange={e => onPart(e.target.value)} placeholder="106828-00" />
        </div>
        <div className={styles.fieldQty}>
          <label className={styles.lbl}>Qty</label>
          <input type="number" min="1" value={item.qty} onChange={e => onQty(e.target.value)} />
        </div>
      </div>

      <div className={styles.cardDivider} />

      <div className={styles.cardBody}>
        <div className={styles.leftCol}>
          <label className={styles.lbl}>Shop</label>
          <div className={styles.shopToggle}>
            <button className={`${styles.shopBtn} ${item.shop === 'metal' ? styles.shopMetal : ''}`} onClick={() => onShop('metal')}>Metal shop</button>
            <button className={`${styles.shopBtn} ${item.shop === 'wood' ? styles.shopWood : ''}`} onClick={() => onShop('wood')}>Wood shop</button>
          </div>

          <label className={styles.lbl}>
            Base processes {removedCount > 0 && <span className={styles.removedNote}>· {removedCount} removed</span>}
          </label>
          <div className={styles.procList}>
            {baseProcs.map(p => (
              <ProcRow key={p.id} proc={p} state={item.procs?.[p.id]} shop={item.shop} isAddon={false}
                onToggle={() => onToggleProc(p.id)} onCx={cx => onProcCx(p.id, cx)} />
            ))}
          </div>

          <div className={styles.addonSep}>Add-ons</div>
          <div className={styles.procList}>
            {addonProcs.map(p => (
              <ProcRow key={p.id} proc={p} state={item.addons?.[p.id]} shop={item.shop} isAddon={true}
                onToggle={() => onToggleAddon(p.id)} onCx={cx => onAddonCx(p.id, cx)} />
            ))}
          </div>
        </div>

        <div className={styles.rightCol}>
          <label className={styles.lbl}>Estimated hours / unit</label>
          <div className={styles.resultBlock}>
            {calc.lines.length === 0 ? (
              <p className={styles.noProcs}>No active processes</p>
            ) : (
              <>
                {calc.lines.map((l, i) => (
                  <div key={i} className={styles.resultLine}>
                    <span className={styles.resultName}>
                      {l.name}
                      <span className={`${styles.cxTag} ${styles['cxTag' + l.cx]}`}>{l.cx}</span>
                      {!l.isBase && <span className={styles.addonTag}>add-on</span>}
                    </span>
                    <span className={styles.resultHrs}>{l.hrs.toFixed(1)} h</span>
                  </div>
                ))}
                <div className={styles.resultTotal}>
                  <div>
                    <div className={styles.totalLabel}>Total labour</div>
                    <div className={styles.totalHrs}>{calc.totalHrs.toFixed(1)}<span className={styles.totalUnit}> h/unit</span></div>
                  </div>
                  {item.qty > 1 && (
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.totalLabel}>× {item.qty} units</div>
                      <div className={styles.totalHrs}>{(calc.totalHrs * item.qty).toFixed(1)}<span className={styles.totalUnit}> h</span></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
