import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DrawingQuote.module.css'

const fmtHrs = (n) => Number(n || 0).toFixed(1) + 'h'
const fmtQty = (n) => Number(n || 0) % 1 === 0 ? Number(n).toFixed(0) : Number(n).toFixed(2)

const LOADING_MSGS = [
  'Reading the drawing…',
  'Searching VE historical data…',
  'Matching similar parts from Infor…',
  'Building the takeoff…',
]

const CONF_CLASS = { high: 'confHigh', medium: 'confMedium', low: 'confLow' }

export default function DrawingQuote() {
  const nav = useNavigate()
  const fileInputRef = useRef(null)
  const loadingTimer = useRef(null)

  const [fileData, setFileData]     = useState(null)
  const [fileType, setFileType]     = useState(null)
  const [fileInfo, setFileInfo]     = useState(null)
  const [preview, setPreview]       = useState(null)
  const [context, setContext]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [takeoff, setTakeoff]       = useState(null)
  const [error, setError]           = useState(null)
  const [dragOver, setDragOver]     = useState(false)

  const processFile = useCallback((file) => {
    setError(null); setTakeoff(null)
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','application/pdf']
    if (!allowed.includes(file.type)) { setError('Unsupported type. Use JPG, PNG, WEBP or PDF.'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setFileData(dataUrl.split(',')[1])
      setFileType(file.type)
      setFileInfo({ name: file.name, size: file.size })
      setPreview(file.type.startsWith('image/') ? dataUrl : null)
    }
    reader.readAsDataURL(file)
  }, [])

  const clearFile = () => {
    setFileData(null); setFileType(null); setFileInfo(null)
    setPreview(null); setTakeoff(null); setError(null); setContext('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }

  const analyze = async () => {
    if (!fileData) return
    setLoading(true); setError(null); setTakeoff(null)
    let msgIdx = 0
    setLoadingMsg(LOADING_MSGS[0])
    loadingTimer.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[msgIdx])
    }, 2500)
    try {
      const res = await fetch('/api/quotes/analyze-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: fileData, mimeType: fileType, context: context.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setTakeoff(data)
    } catch (err) {
      setError(err.message)
    } finally {
      clearInterval(loadingTimer.current)
      setLoading(false)
    }
  }

  const fmtBytes = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(0) + ' KB' : (b/1048576).toFixed(1) + ' MB'

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoBlock}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>VE</div>
            <span className={styles.logoText}>AI drawing takeoff</span>
          </div>
          <span className={styles.sub}>Quantities & hours from drawing + VE Infor history</span>
        </div>
        <button className={styles.btnBack} onClick={() => nav('/')}>← Back</button>
      </div>

      {/* Drop zone */}
      {!fileInfo && (
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:'none' }}
            onChange={(e) => { if (e.target.files[0]) processFile(e.target.files[0]) }} />
          <div className={styles.dropIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className={styles.dropLabel}>Drop your drawing here or click to browse</div>
          <div className={styles.dropSub}>2D drawings, shop drawings, renders — JPG, PNG, PDF</div>
          <div className={styles.badges}>
            {['JPG','PNG','PDF','WEBP'].map(t => <span key={t} className={styles.badge}>{t}</span>)}
          </div>
        </div>
      )}

      {/* Preview */}
      {fileInfo && (
        <div className={styles.previewCard}>
          {preview
            ? <img src={preview} alt="preview" className={styles.thumb} />
            : <div className={styles.thumbPdf}>PDF</div>}
          <div className={styles.previewInfo}>
            <div className={styles.previewName}>{fileInfo.name}</div>
            <div className={styles.previewSize}>{fmtBytes(fileInfo.size)}</div>
            <button className={styles.btnRemove} onClick={clearFile}>Remove</button>
          </div>
        </div>
      )}

      {/* Context */}
      {fileInfo && (
        <div className={styles.contextArea}>
          <label className={styles.contextLabel}>Additional context (optional)</label>
          <textarea className={styles.contextInput} value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Ex: Lululemon backwall, oak veneer, 5 modules, 20ft wide, melamine interiors, Blum hardware..." />
        </div>
      )}

      {/* Button */}
      {fileInfo && !loading && (
        <button className={styles.btnAnalyze} onClick={analyze} disabled={!fileData}>
          Generate takeoff
        </button>
      )}

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>{loadingMsg}</div>
          <div className={styles.loadingSteps}>
            <span className={styles.loadingStep}>1. Read drawing</span>
            <span className={styles.loadingArrow}>→</span>
            <span className={styles.loadingStep}>2. Search Infor history</span>
            <span className={styles.loadingArrow}>→</span>
            <span className={styles.loadingStep}>3. Generate takeoff</span>
          </div>
        </div>
      )}

      {/* Takeoff result */}
      {takeoff && !loading && (
        <div className={styles.result}>

          {/* Title row */}
          <div className={styles.resultHeader}>
            <div>
              <div className={styles.resultTitle}>{takeoff.part_name || 'Takeoff result'}</div>
              {takeoff.summary && <div className={styles.summary}>{takeoff.summary}</div>}
            </div>
            <div className={styles.badges2}>
              <span className={`${styles.confBadge} ${styles[CONF_CLASS[takeoff.confidence] || 'confLow']}`}>
                {takeoff.confidence} confidence
              </span>
              {takeoff._db_searched && (
                <span className={styles.dbBadge}>
                  {takeoff.historical_matches || '?'} Infor matches
                </span>
              )}
            </div>
          </div>

          {/* Dimensions + totals row */}
          <div className={styles.metricsGrid}>
            {takeoff.dimensions && (
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Dimensions</div>
                <div className={styles.metricValue} style={{fontSize:14}}>
                  {takeoff.dimensions.width_mm}W × {takeoff.dimensions.height_mm}H × {takeoff.dimensions.depth_mm}D
                </div>
                <div className={styles.metricSub}>mm · {takeoff.dimensions.source}</div>
              </div>
            )}
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total hours</div>
              <div className={styles.metricValue}>{fmtHrs(takeoff.total_hours)}</div>
              <div className={styles.metricSub}>{(takeoff.operations||[]).length} operations</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Material lines</div>
              <div className={styles.metricValue}>{(takeoff.materials||[]).length}</div>
              <div className={styles.metricSub}>items to price</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Lead time</div>
              <div className={styles.metricValue}>{takeoff.lead_time_days || '—'}</div>
              <div className={styles.metricSub}>business days</div>
            </div>
          </div>

          {/* Keywords used */}
          {takeoff._keywords_used?.length > 0 && (
            <div className={styles.keywordsRow}>
              <span className={styles.keywordsLabel}>Searched Infor with:</span>
              {takeoff._keywords_used.map(k => <span key={k} className={styles.keyword}>{k}</span>)}
            </div>
          )}

          {/* Materials */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              Materials
              <span className={styles.sectionNote}>— quantities to price by estimator</span>
            </div>
            <div className={styles.tableHeader}>
              <span className={styles.colItem}>Item</span>
              <span className={styles.colSpec}>Spec</span>
              <span className={styles.colQty}>Qty</span>
              <span className={styles.colUnit}>Unit</span>
            </div>
            {(takeoff.materials || []).map((m, i) => (
              <div key={i} className={styles.tableRow}>
                <span className={styles.colItem}>{m.item}</span>
                <span className={styles.colSpec}>{m.spec || '—'}</span>
                <span className={`${styles.colQty} ${styles.mono}`}>{fmtQty(m.qty)}</span>
                <span className={styles.colUnit}>{m.unit}</span>
              </div>
            ))}
          </div>

          {/* Operations */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              Operations & labour
              <span className={styles.sectionNote}>— based on VE historical data</span>
            </div>
            <div className={styles.tableHeader}>
              <span className={styles.colItem}>Operation</span>
              <span className={styles.colSpec}>Notes</span>
              <span className={styles.colQty}>Hours</span>
              <span className={styles.colUnit}></span>
            </div>
            {(takeoff.operations || []).map((o, i) => (
              <div key={i} className={styles.tableRow}>
                <span className={styles.colItem}>{o.operation}</span>
                <span className={styles.colSpec}>{o.notes || '—'}</span>
                <span className={`${styles.colQty} ${styles.mono} ${styles.accent}`}>{fmtHrs(o.hours)}</span>
                <span className={styles.colUnit}></span>
              </div>
            ))}
            <div className={styles.tableTotal}>
              <span>Total</span>
              <span className={`${styles.mono} ${styles.accent}`}>{fmtHrs(takeoff.total_hours)}</span>
            </div>
          </div>

          {/* Hardware */}
          {(takeoff.hardware || []).length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Hardware
                <span className={styles.sectionNote}>— to price by estimator</span>
              </div>
              <div className={styles.tableHeader}>
                <span className={styles.colItem}>Item</span>
                <span className={styles.colSpec}>Notes</span>
                <span className={styles.colQty}>Qty</span>
                <span className={styles.colUnit}>Unit</span>
              </div>
              {(takeoff.hardware || []).map((h, i) => (
                <div key={i} className={styles.tableRow}>
                  <span className={styles.colItem}>{h.item}</span>
                  <span className={styles.colSpec}>{h.notes || '—'}</span>
                  <span className={`${styles.colQty} ${styles.mono}`}>{fmtQty(h.qty)}</span>
                  <span className={styles.colUnit}>{h.unit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {takeoff.notes && (
            <div className={styles.notes}>
              <strong>Estimator notes:</strong> {takeoff.notes}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.btnBack} onClick={clearFile}>New takeoff</button>
            <button className={styles.btnNew} onClick={() => nav('/quote/new')}>Open in quote editor →</button>
          </div>

        </div>
      )}
    </div>
  )
}
