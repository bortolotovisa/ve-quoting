import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MaterialCalc.module.css'

export default function MaterialCalc() {
  const nav = useNavigate()
  const [tab, setTab] = useState('sheets')

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => nav('/')}>← All quotes</button>
      </div>

      <div className={styles.header}>
        <div className={styles.title}>Material estimator</div>
        <p className={styles.sub}>Dimensional calculators for quick material estimates on new projects</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'sheets' ? styles.tabActive : ''}`} onClick={() => setTab('sheets')}>
          Sheet goods
        </button>
        <button className={`${styles.tab} ${tab === 'tubing' ? styles.tabActive : ''}`} onClick={() => setTab('tubing')}>
          Tubing / metal
        </button>
      </div>

      {tab === 'sheets' && <SheetCalc />}
      {tab === 'tubing' && <TubingCalc />}
    </div>
  )
}

function SheetCalc() {
  const [panels, setPanels] = useState([
    { id: 1, name: 'Panel 1', length: 48, width: 24, qty: 1 }
  ])
  const [sheetL, setSheetL] = useState(96)
  const [sheetW, setSheetW] = useState(48)
  const [waste, setWaste] = useState(12)
  const [unit, setUnit] = useState('in')

  let nextId = panels.length + 1

  function addPanel() {
    setPanels([...panels, { id: Date.now(), name: `Panel ${panels.length + 1}`, length: 48, width: 24, qty: 1 }])
  }

  function removePanel(id) {
    setPanels(panels.filter(p => p.id !== id))
  }

  function updatePanel(id, field, value) {
    setPanels(panels.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const sheetArea = sheetL * sheetW
  const usableArea = sheetArea * (1 - waste / 100)

  const panelResults = panels.map(p => {
    const panelArea = p.length * p.width
    const totalArea = panelArea * (p.qty || 1)
    return { ...p, panelArea, totalArea }
  })

  const grandTotalArea = panelResults.reduce((sum, p) => sum + p.totalArea, 0)
  const sheetsNeeded = usableArea > 0 ? Math.ceil(grandTotalArea / usableArea) : 0
  const utilization = sheetsNeeded > 0 ? ((grandTotalArea / (sheetsNeeded * sheetArea)) * 100).toFixed(1) : 0

  const unitLabel = unit === 'in' ? 'in' : 'mm'
  const unitLabel2 = unit === 'in' ? 'in²' : 'mm²'

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcHeader}>
        <div>
          <div className={styles.calcTitle}>Sheet goods calculator</div>
          <div className={styles.calcSub}>MDF, plywood, melamine, laminate — how many sheets do you need?</div>
        </div>
        <div className={styles.unitToggle}>
          <button className={`${styles.unitBtn} ${unit === 'in' ? styles.unitActive : ''}`} onClick={() => setUnit('in')}>Inches</button>
          <button className={`${styles.unitBtn} ${unit === 'mm' ? styles.unitActive : ''}`} onClick={() => setUnit('mm')}>mm</button>
        </div>
      </div>

      <div className={styles.sheetConfig}>
        <div className={styles.configLabel}>Sheet size</div>
        <div className={styles.configRow}>
          <div className={styles.configField}>
            <label className={styles.lbl}>Length ({unitLabel})</label>
            <input type="number" value={sheetL} onChange={e => setSheetL(+e.target.value)} />
          </div>
          <span className={styles.configX}>×</span>
          <div className={styles.configField}>
            <label className={styles.lbl}>Width ({unitLabel})</label>
            <input type="number" value={sheetW} onChange={e => setSheetW(+e.target.value)} />
          </div>
          <div className={styles.configField}>
            <label className={styles.lbl}>Waste %</label>
            <input type="number" value={waste} onChange={e => setWaste(+e.target.value)} min="0" max="50" />
          </div>
        </div>
        <div className={styles.presets}>
          <span className={styles.presetLabel}>Presets:</span>
          <button className={styles.preset} onClick={() => { setSheetL(96); setSheetW(48); setUnit('in') }}>4×8 ft</button>
          <button className={styles.preset} onClick={() => { setSheetL(120); setSheetW(60); setUnit('in') }}>5×10 ft</button>
          <button className={styles.preset} onClick={() => { setSheetL(2440); setSheetW(1220); setUnit('mm') }}>2440×1220</button>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.panelHeader}>
          <span className={styles.configLabel}>Panels to cut</span>
          <button className={styles.addPanelBtn} onClick={addPanel}>+ Add panel</button>
        </div>

        {panels.map((p, i) => (
          <div key={p.id} className={styles.panelRow}>
            <div className={styles.panelName}>
              <input value={p.name} onChange={e => updatePanel(p.id, 'name', e.target.value)} placeholder={`Panel ${i + 1}`} />
            </div>
            <div className={styles.panelDim}>
              <label className={styles.lbl}>L ({unitLabel})</label>
              <input type="number" value={p.length} onChange={e => updatePanel(p.id, 'length', +e.target.value)} />
            </div>
            <span className={styles.configX}>×</span>
            <div className={styles.panelDim}>
              <label className={styles.lbl}>W ({unitLabel})</label>
              <input type="number" value={p.width} onChange={e => updatePanel(p.id, 'width', +e.target.value)} />
            </div>
            <div className={styles.panelQty}>
              <label className={styles.lbl}>Qty</label>
              <input type="number" value={p.qty} min="1" onChange={e => updatePanel(p.id, 'qty', +e.target.value)} />
            </div>
            <div className={styles.panelArea}>
              {(p.length * p.width * (p.qty || 1)).toLocaleString()} {unitLabel2}
            </div>
            {panels.length > 1 && (
              <button className={styles.removePanelBtn} onClick={() => removePanel(p.id)}>×</button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.resultCard}>
        <div className={styles.resultGrid}>
          <div className={styles.resultItem}>
            <div className={styles.resultLabel}>Total panel area</div>
            <div className={styles.resultValue}>{grandTotalArea.toLocaleString()} {unitLabel2}</div>
          </div>
          <div className={styles.resultItem}>
            <div className={styles.resultLabel}>Sheet area (usable at {waste}% waste)</div>
            <div className={styles.resultValue}>{Math.round(usableArea).toLocaleString()} {unitLabel2}</div>
          </div>
          <div className={styles.resultMain}>
            <div className={styles.resultLabel}>Sheets needed</div>
            <div className={styles.resultBig}>{sheetsNeeded}</div>
            <div className={styles.resultSub}>{sheetL}×{sheetW} {unitLabel} sheets · {utilization}% utilization</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TubingCalc() {
  const [pieces, setPieces] = useState([
    { id: 1, name: 'Uprights', length: 60, qty: 4 },
    { id: 2, name: 'Crossbars top', length: 72, qty: 2 },
    { id: 3, name: 'Crossbars bottom', length: 72, qty: 2 },
  ])
  const [profile, setProfile] = useState('1x1 Square')
  const [unit, setUnit] = useState('in')
  const [cutWaste, setCutWaste] = useState(0.5)

  function addPiece() {
    setPieces([...pieces, { id: Date.now(), name: `Piece ${pieces.length + 1}`, length: 48, qty: 1 }])
  }

  function removePiece(id) {
    setPieces(pieces.filter(p => p.id !== id))
  }

  function updatePiece(id, field, value) {
    setPieces(pieces.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const unitLabel = unit === 'in' ? 'in' : 'mm'
  const stockLength = unit === 'in' ? 240 : 6096 // 20ft standard stock
  const cutWasteIn = unit === 'in' ? cutWaste : cutWaste * 25.4

  const pieceResults = pieces.map(p => {
    const totalLength = (p.length + cutWasteIn) * (p.qty || 1)
    return { ...p, totalLength }
  })

  const grandTotalLength = pieceResults.reduce((sum, p) => sum + p.totalLength, 0)
  const stocksNeeded = stockLength > 0 ? Math.ceil(grandTotalLength / stockLength) : 0

  const toFt = (v) => unit === 'in' ? (v / 12).toFixed(1) : (v / 304.8).toFixed(1)

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcHeader}>
        <div>
          <div className={styles.calcTitle}>Tubing / metal calculator</div>
          <div className={styles.calcSub}>Calculate total linear length and number of stock pieces needed</div>
        </div>
        <div className={styles.unitToggle}>
          <button className={`${styles.unitBtn} ${unit === 'in' ? styles.unitActive : ''}`} onClick={() => setUnit('in')}>Inches</button>
          <button className={`${styles.unitBtn} ${unit === 'mm' ? styles.unitActive : ''}`} onClick={() => setUnit('mm')}>mm</button>
        </div>
      </div>

      <div className={styles.sheetConfig}>
        <div className={styles.configRow}>
          <div className={styles.configField} style={{ flex: 2 }}>
            <label className={styles.lbl}>Profile</label>
            <select value={profile} onChange={e => setProfile(e.target.value)}>
              <optgroup label="Square tube">
                <option>1×1 Square</option>
                <option>1.5×1.5 Square</option>
                <option>2×2 Square</option>
              </optgroup>
              <optgroup label="Rectangular tube">
                <option>1×2 Rectangular</option>
                <option>1×3 Rectangular</option>
                <option>2×3 Rectangular</option>
                <option>2×4 Rectangular</option>
              </optgroup>
              <optgroup label="Round tube">
                <option>1" Round</option>
                <option>1.5" Round</option>
                <option>2" Round</option>
              </optgroup>
              <optgroup label="Other">
                <option>Flat bar</option>
                <option>Angle iron</option>
                <option>Channel</option>
                <option>Custom</option>
              </optgroup>
            </select>
          </div>
          <div className={styles.configField}>
            <label className={styles.lbl}>Stock length ({unitLabel})</label>
            <input type="number" value={stockLength} readOnly style={{ opacity: 0.6 }} />
          </div>
          <div className={styles.configField}>
            <label className={styles.lbl}>Cut waste ({unitLabel})</label>
            <input type="number" value={cutWaste} onChange={e => setCutWaste(+e.target.value)} step="0.25" />
          </div>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.panelHeader}>
          <span className={styles.configLabel}>Cut list</span>
          <button className={styles.addPanelBtn} onClick={addPiece}>+ Add piece</button>
        </div>

        {pieces.map((p, i) => (
          <div key={p.id} className={styles.panelRow}>
            <div className={styles.panelName}>
              <input value={p.name} onChange={e => updatePiece(p.id, 'name', e.target.value)} placeholder={`Piece ${i + 1}`} />
            </div>
            <div className={styles.panelDim}>
              <label className={styles.lbl}>Length ({unitLabel})</label>
              <input type="number" value={p.length} onChange={e => updatePiece(p.id, 'length', +e.target.value)} />
            </div>
            <div className={styles.panelQty}>
              <label className={styles.lbl}>Qty</label>
              <input type="number" value={p.qty} min="1" onChange={e => updatePiece(p.id, 'qty', +e.target.value)} />
            </div>
            <div className={styles.panelArea}>
              {toFt(p.length * (p.qty || 1))} ft
            </div>
            {pieces.length > 1 && (
              <button className={styles.removePanelBtn} onClick={() => removePiece(p.id)}>×</button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.resultCard}>
        <div className={styles.resultGrid}>
          <div className={styles.resultItem}>
            <div className={styles.resultLabel}>Total linear length</div>
            <div className={styles.resultValue}>{Math.round(grandTotalLength).toLocaleString()} {unitLabel} ({toFt(grandTotalLength)} ft)</div>
          </div>
          <div className={styles.resultItem}>
            <div className={styles.resultLabel}>Profile</div>
            <div className={styles.resultValue}>{profile}</div>
          </div>
          <div className={styles.resultMain}>
            <div className={styles.resultLabel}>Stock pieces needed</div>
            <div className={styles.resultBig}>{stocksNeeded}</div>
            <div className={styles.resultSub}>@ {unit === 'in' ? '20 ft' : '6096mm'} stock lengths · includes {cutWaste}{unitLabel} cut waste per piece</div>
          </div>
        </div>
      </div>
    </div>
  )
}
