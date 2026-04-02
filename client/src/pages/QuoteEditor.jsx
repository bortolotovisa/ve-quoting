import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9'
import {
  CX, BASE_PROCESSES, ADDON_PROCESSES,
  defaultActive, calcItem, calcQuoteTotalHrs
} from '../quoteData'
import styles from './QuoteEditor.module.css'

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

  useEffect(() => {
    if (!isNew) loadQuote()
    else addItem()
  }, [])

  async function loadQuote() {
    try {
      const r = await fetch(`/api/quotes/${id}`)
      const q = await r.json()
      setName(q.name)
      setClient(q.client || '')
      setItems(q.items || [])
    } finally { setLoading(false) }
  }

  const autoSave = useCallback((newName, newClient, newItems) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(newName, newClient, newItems), 900)
  }, [quoteId])

  async function save(n, c, itms) {
    setSaving(true)
    const totalHrs = calcQuoteTotalHrs(itms)
    const body = { name: n, client: c, items: itms, total_hours: totalHrs }
    if (!quoteId) {
      const r = await fetch('/api/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const { id: newId } = await r.json()
      setQuoteId(newId)
      window.history.replaceState(null, '', `/quote/${newId}`)
    } else {
      await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(newName, newClient, newItems) {
    setName(newName); setClient(newClient); setItems(newItems)
    autoSave(newName, newClient, newItems)
  }

  function addItem() {
    const shop = 'metal'
    const newItem = { id: uuidv4(), desc: '', partNum: '', qty: 1, shop, cx: 'M', active: defaultActive(shop), addons: {} }
    const next = [...items, newItem]
    update(name, client, next)
  }

  function removeItem(itemId) {
    update(name, client, items.filter(i => i.id !== itemId))
  }

  function updateItem(itemId, patch) {
    update(name, client, items.map(i => i.id === itemId ? { ...i, ...patch } : i))
  }

  function setShop(itemId, shop) {
    updateItem(itemId, { shop, active: defaultActive(shop), addons: {} })
  }

  function toggleBase(itemId, pid) {
    const item = items.find(i => i.id === itemId)
    updateItem(itemId, { active: { ...item.active, [pid]: !item.active[pid] } })
  }

  function toggleAddon(itemId, aid) {
    const item = items.find(i => i.id === itemId)
    const addons = { ...item.addons }
    addons[aid] ? delete addons[aid] : addons[aid] = true
    updateItem(itemId, { addons })
  }

  const totalHrs = calcQuoteTotalHrs(items)

  if (loading) return <div className={styles.loading}>Loading...</div>

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => nav('/')}>← All quotes</button>
        <div className={styles.saveStatus}>
          {saving ? <span className={styles.saving}>Saving...</span>
            : saved ? <span className={styles.saved}>Saved</span>
            : null}
        </div>
      </div>

      <div className={styles.quoteHeader}>
        <div className={styles.headerLeft}>
          <input
            className={styles.nameInput}
            value={name}
            onChange={e => update(e.target.value, client, items)}
            placeholder="Quote name"
          />
          <input
            className={styles.clientInput}
            value={client}
            onChange={e => update(name, e.target.value, items)}
            placeholder="Client (optional)"
          />
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
          <ItemCard
            key={item.id}
            item={item}
            idx={idx}
            onRemove={() => removeItem(item.id)}
            onDescChange={v => updateItem(item.id, { desc: v })}
            onPartChange={v => updateItem(item.id, { partNum: v })}
            onQtyChange={v => updateItem(item.id, { qty: Math.max(1, parseInt(v) || 1) })}
            onShop={s => setShop(item.id, s)}
            onCx={cx => updateItem(item.id, { cx })}
            onToggleBase={pid => toggleBase(item.id, pid)}
            onToggleAddon={aid => toggleAddon(item.id, aid)}
          />
        ))}
      </div>

      {items.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryTitle}>Summary</div>
          {items.map((item, idx) => {
            const { totalHrs: iHrs } = calcItem(item)
            const lineHrs = +(iHrs * item.qty).toFixed(1)
            return (
              <div key={item.id} className={styles.sumRow}>
                <span className={`${styles.shopDot} ${item.shop === 'metal' ? styles.dotMetal : styles.dotWood}`} />
                <span className={styles.sumDesc}>{item.desc || `Item ${idx + 1}`}{item.qty > 1 ? ` ×${item.qty}` : ''}</span>
                <span className={styles.sumInfo}>{CX[item.cx].label} · {iHrs.toFixed(1)}h/unit</span>
                <span className={styles.sumHrs}>{lineHrs.toFixed(1)} h</span>
              </div>
            )
          })}
          <div className={styles.sumTotal}>
            <span>Total labour estimated</span>
            <span className={`${styles.totalHrs} mono`}>{totalHrs.toFixed(1)} h</span>
          </div>
          <p className={styles.sumNote}>+ material cost (external) · apply Infor rates to these hours</p>
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, idx, onRemove, onDescChange, onPartChange, onQtyChange, onShop, onCx, onToggleBase, onToggleAddon }) {
  const calc = calcItem(item)
  const isWood = item.shop === 'wood'
  const baseProcs = BASE_PROCESSES[item.shop] || []
  const addonProcs = ADDON_PROCESSES[item.shop] || []
  const removedCount = baseProcs.filter(p => !item.active[p.id]).length

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.itemNum}>Item {idx + 1}</span>
        <button className={styles.removeBtn} onClick={onRemove}>Remove</button>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldDesc}>
          <label className={styles.lbl}>Description</label>
          <input value={item.desc} onChange={e => onDescChange(e.target.value)} placeholder="Ex: Midrack metal, Cashwrap wood..." />
        </div>
        <div className={styles.fieldPart}>
          <label className={styles.lbl}>Part # (optional)</label>
          <input value={item.partNum} onChange={e => onPartChange(e.target.value)} placeholder="106828-00" />
        </div>
        <div className={styles.fieldQty}>
          <label className={styles.lbl}>Qty</label>
          <input type="number" min="1" value={item.qty} onChange={e => onQtyChange(e.target.value)} />
        </div>
      </div>

      <div className={styles.cardDivider} />

      <div className={styles.cardBody}>
        <div className={styles.leftCol}>
          <label className={styles.lbl}>Shop</label>
          <div className={styles.shopToggle}>
            <button
              className={`${styles.shopBtn} ${item.shop === 'metal' ? styles.shopMetal : ''}`}
              onClick={() => onShop('metal')}>Metal shop</button>
            <button
              className={`${styles.shopBtn} ${item.shop === 'wood' ? styles.shopWood : ''}`}
              onClick={() => onShop('wood')}>Wood shop</button>
          </div>

          <label className={styles.lbl}>
            Processes
            {removedCount > 0 && <span className={styles.removedNote}> · {removedCount} removed</span>}
          </label>
          <div className={styles.chips}>
            {baseProcs.map(p => (
              <span
                key={p.id}
                className={`${styles.chip} ${item.active[p.id] ? (isWood ? styles.chipWood : styles.chipMetal) : styles.chipOff}`}
                onClick={() => onToggleBase(p.id)}
              >
                <span className={styles.chipX}>{item.active[p.id] ? '×' : '+'}</span>
                {p.name}
              </span>
            ))}
          </div>

          <label className={styles.lbl} style={{ marginTop: '12px' }}>Add-ons</label>
          <div className={styles.chips}>
            {addonProcs.map(p => (
              <span
                key={p.id}
                className={`${styles.chip} ${item.addons[p.id] ? styles.chipAddon : styles.chipOff}`}
                onClick={() => onToggleAddon(p.id)}
              >
                <span className={styles.chipX}>{item.addons[p.id] ? '×' : '+'}</span>
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.rightCol}>
          <label className={styles.lbl}>Complexity</label>
          <div className={styles.cxGrid}>
            {['S', 'M', 'C'].map(cx => (
              <button
                key={cx}
                className={`${styles.cxCard} ${item.cx === cx ? styles['cx' + cx] : ''}`}
                onClick={() => onCx(cx)}
              >
                <div className={styles.cxName}>{CX[cx].label}</div>
                <div className={styles.cxDesc}>{CX[cx].desc}</div>
                <div className={styles.cxMult}>×{CX[cx].mult.toFixed(1)}</div>
              </button>
            ))}
          </div>

          <div className={styles.resultBlock}>
            <label className={styles.lbl}>Estimated hours / unit</label>
            {calc.lines.length === 0 ? (
              <p className={styles.noProcs}>No active processes</p>
            ) : (
              <>
                {calc.lines.map((l, i) => (
                  <div key={i} className={styles.resultLine}>
                    <span className={styles.resultName}>
                      {l.name}
                      {!l.isBase && <span className={styles.addonTag}>add-on</span>}
                    </span>
                    <span className={`${styles.resultHrs} mono`}>{l.hrs.toFixed(1)} h</span>
                  </div>
                ))}
                <div className={styles.resultTotal}>
                  <div>
                    <div className={styles.totalLabel}>Total labour</div>
                    <div className={`${styles.totalHrs} mono`}>
                      {calc.totalHrs.toFixed(1)}<span className={styles.totalUnit}> h/unit</span>
                    </div>
                  </div>
                  {item.qty > 1 && (
                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.totalLabel}>× {item.qty} units</div>
                      <div className={`${styles.totalHrs} mono`}>
                        {(calc.totalHrs * item.qty).toFixed(1)}<span className={styles.totalUnit}> h</span>
                      </div>
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
