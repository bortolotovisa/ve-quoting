import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DrawingQuote.module.css'

// ── Helpers ───────────────────────────────────────────────────
const fmtCAD = (n) =>
  'CA$' + Number(n || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtHrs = (n) => Number(n || 0).toFixed(1) + 'h'

const fmtBytes = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const LOADING_MSGS = [
  'Analyzing the drawing with AI…',
  'Identifying materials and components…',
  'Estimating machining and assembly hours…',
  'Building the cost breakdown…',
]

// ── Main Component ────────────────────────────────────────────
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
  const [quote, setQuote]           = useState(null)
  const [error, setError]           = useState(null)
  const [dragOver, setDragOver]     = useState(false)

  // ── File handling ─────────────────────────────────────────
  const processFile = useCallback((file) => {
    setError(null)
    setQuote(null)
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, PNG, WEBP, or PDF.')
      return
    }
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
    setPreview(null); setQuote(null); setError(null); setContext('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])
  }

  // ── API call ──────────────────────────────────────────────
  const analyzeDrawing = async () => {
    if (!fileData) return
    setLoading(true); setError(null); setQuote(null)
    let msgIdx = 0
    setLoadingMsg(LOADING_MSGS[0])
    loadingTimer.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[msgIdx])
    }, 2200)

    try {
      const response = await fetch('/api/quotes/analyze-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: fileData,
          mimeType: fileType,
          context: context.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Server error ${response.status}`)
      setQuote(data)
    } catch (err) {
      setError(err.message)
    } finally {
      clearInterval(loadingTimer.current)
      setLoading(false)
    }
  }

  // ── Confidence badge helper ───────────────────────────────
  const confClass = quote
    ? quote.confidence === 'high' ? styles.confHigh
      : quote.confidence === 'medium' ? styles.confMedium
      : styles.confLow
    : ''

  const totalHrs = quote ? (quote.operations || []).reduce((s, o) => s + (o.hours || 0), 0) : 0

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoBlock}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>VE</div>
            <span className={styles.logoText}>AI drawing quote</span>
          </div>
          <span className={styles.sub}>Upload a drawing or render — AI generates a production estimate</span>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files[0]) processFile(e.target.files[0]) }}
          />
          <div className={styles.dropIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className={styles.dropLabel}>Drop your file here or click to browse</div>
          <div className={styles.dropSub}>Images and PDFs of 2D drawings, renders, and shop drawings</div>
          <div className={styles.badges}>
            {['JPG', 'PNG', 'WEBP', 'PDF'].map(t => <span key={t} className={styles.badge}>{t}</span>)}
          </div>
        </div>
      )}

      {/* File preview */}
      {fileInfo && (
        <div className={styles.previewCard}>
          {preview
            ? <img src={preview} alt="preview" className={styles.thumb} />
            : <div className={styles.thumbPdf}>PDF</div>
          }
          <div className={styles.previewInfo}>
            <div className={styles.previewName}>{fileInfo.name}</div>
            <div className={styles.previewSize}>{fmtBytes(fileInfo.size)}</div>
            <button className={styles.btnRemove} onClick={clearFile}>Remove</button>
          </div>
        </div>
      )}

      {/* Context input */}
      {fileInfo && (
        <div className={styles.contextArea}>
          <label className={styles.contextLabel}>Additional context (optional)</label>
          <textarea
            className={styles.contextInput}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ex: cabinet in MDF 18mm, lacquer finish, 3 adjustable shelves, Blum hardware..."
          />
        </div>
      )}

      {/* Analyze button */}
      {fileInfo && !loading && (
        <button
          className={styles.btnAnalyze}
          onClick={analyzeDrawing}
          disabled={!fileData}
        >
          Analyze and quote
        </button>
      )}

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>{loadingMsg}</div>
        </div>
      )}

      {/* Quote result */}
      {quote && !loading && (
        <div className={styles.result}>

          <div className={styles.resultHeader}>
            <div className={styles.resultTitle}>{quote.part_name || 'Quote result'}</div>
            <span className={`${styles.confBadge} ${confClass}`}>
              {quote.confidence} confidence
            </span>
          </div>

          {quote.summary && (
            <p className={styles.summary}>{quote.summary}</p>
          )}

          {/* Metric cards */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Grand total</div>
              <div className={`${styles.metricValue} ${styles.metricAccent}`}>{fmtCAD(quote.totals?.grand_total_cad)}</div>
              <div className={styles.metricSub}>incl. 15% markup</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Labour</div>
              <div className={styles.metricValue}>{fmtCAD(quote.totals?.labour_cad)}</div>
              <div className={styles.metricSub}>{fmtHrs(totalHrs)} total</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Materials</div>
              <div className={styles.metricValue}>{fmtCAD(quote.totals?.materials_cad)}</div>
              <div className={styles.metricSub}>raw cost</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Lead time</div>
              <div className={styles.metricValue}>{quote.lead_time_days || '—'}</div>
              <div className={styles.metricSub}>business days</div>
            </div>
          </div>

          {/* Dimensions */}
          {quote.dimensions_estimated && (
            <div className={styles.dims}>
              Estimated: {quote.dimensions_estimated.width_mm}W × {quote.dimensions_estimated.height_mm}H × {quote.dimensions_estimated.depth_mm}D mm
            </div>
          )}

          {/* Materials */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Materials</div>
            {(quote.materials || []).map((m, i) => (
              <div key={i} className={styles.itemRow}>
                <span>{m.name} {m.spec && <span className={styles.itemSub}>{m.spec}</span>}</span>
                <span className={styles.itemVal}>{m.qty} · {fmtCAD(m.total_cost)}</span>
              </div>
            ))}
          </div>

          {/* Operations */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Operations & labour</div>
            {(quote.operations || []).map((o, i) => (
              <div key={i} className={styles.itemRow}>
                <span>{o.operation}</span>
                <span className={`${styles.itemVal} ${styles.itemAccent}`}>{fmtHrs(o.hours)} · {fmtCAD(o.total_cad)}</span>
              </div>
            ))}
          </div>

          {/* Hardware */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Hardware</div>
            {(quote.hardware || []).length
              ? (quote.hardware || []).map((h, i) => (
                  <div key={i} className={styles.itemRow}>
                    <span>{h.item}</span>
                    <span className={styles.itemVal}>{h.qty}x · {fmtCAD(h.total_cost)}</span>
                  </div>
                ))
              : <div className={styles.itemNone}>None specified</div>
            }
          </div>

          {/* Cost summary */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Cost summary</div>
            <div className={styles.itemRow}><span>Materials</span><span className={styles.itemVal}>{fmtCAD(quote.totals?.materials_cad)}</span></div>
            <div className={styles.itemRow}><span>Labour</span><span className={styles.itemVal}>{fmtCAD(quote.totals?.labour_cad)}</span></div>
            <div className={styles.itemRow}><span>Hardware</span><span className={styles.itemVal}>{fmtCAD(quote.totals?.hardware_cad)}</span></div>
            <div className={styles.itemRow}><span>Subtotal</span><span className={styles.itemVal}>{fmtCAD(quote.totals?.subtotal_cad)}</span></div>
            <div className={styles.itemRow}><span>Markup (15%)</span><span className={styles.itemVal}>{fmtCAD(quote.totals?.markup_15pct)}</span></div>
            <div className={`${styles.itemRow} ${styles.itemRowTotal}`}>
              <span>Grand total</span>
              <span className={`${styles.itemVal} ${styles.itemAccent}`}>{fmtCAD(quote.totals?.grand_total_cad)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className={styles.notes}>{quote.notes}</div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.btnBack} onClick={clearFile}>New quote</button>
            <button className={styles.btnNew} onClick={() => nav('/quote/new')}>Open in quote editor →</button>
          </div>

        </div>
      )}
    </div>
  )
}
