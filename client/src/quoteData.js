export const CX = {
  S: { mult: 1.0, label: 'Simple',  desc: 'Peça padrão, sem customização' },
  M: { mult: 1.3, label: 'Medium',  desc: 'Ajustes de dimensão ou acabamento' },
  C: { mult: 1.7, label: 'Complex', desc: 'Customização significativa / novo' },
}

export const BASE_PROCESSES = {
  metal: [
    { id: 'laser',      name: 'Laser / plasma cut',    awo: 2.50 },
    { id: 'sheetmetal', name: 'Sheet metal / bending',  awo: 2.69 },
    { id: 'welding',    name: 'Welding',                awo: 11.21 },
    { id: 'polishing',  name: 'Polishing',              awo: 9.03 },
  ],
  wood: [
    { id: 'cnc',        name: 'CNC / nesting',          awo: 6.73 },
    { id: 'edge',       name: 'Edge banding',            awo: 4.48 },
    { id: 'panel_saw',  name: 'Panel saw',               awo: 5.79 },
    { id: 'w_assembly', name: 'Wood assembly',           awo: 40.17 },
    { id: 'w_finish',   name: 'Wood finishing',          awo: 7.58 },
    { id: 'w_pack',     name: 'Packaging',               awo: 6.22 },
  ],
}

export const ADDON_PROCESSES = {
  metal: [
    { id: 'powder',      name: 'Powder coat',    awo: 1.92 },
    { id: 'pvd',         name: 'PVD',            awo: 8.47 },
    { id: 'm_assembly',  name: 'Metal assembly', awo: 4.90 },
    { id: 'tube_laser',  name: 'Tube laser',     awo: 1.87 },
    { id: 'tube_cut',    name: 'Tube cutting',   awo: 1.70 },
    { id: 'machining',   name: 'Machining',      awo: 5.30 },
  ],
  wood: [
    { id: 'laminate',    name: 'Laminating',     awo: 2.58 },
    { id: 'painting',    name: 'Painting',       awo: 7.58 },
  ],
}

export function defaultActive(shop) {
  const state = {}
  ;(BASE_PROCESSES[shop] || []).forEach(p => { state[p.id] = true })
  return state
}

export function calcItem(item) {
  const mult = CX[item.cx]?.mult || 1
  const base = BASE_PROCESSES[item.shop] || []
  const addons = ADDON_PROCESSES[item.shop] || []
  const lines = [
    ...base.filter(p => item.active?.[p.id]).map(p => ({
      name: p.name, hrs: +(p.awo * mult).toFixed(2), isBase: true,
    })),
    ...addons.filter(p => item.addons?.[p.id]).map(p => ({
      name: p.name, hrs: +(p.awo * mult).toFixed(2), isBase: false,
    })),
  ]
  const totalHrs = +lines.reduce((s, l) => s + l.hrs, 0).toFixed(2)
  return { lines, totalHrs }
}

export function calcQuoteTotalHrs(items) {
  return +items.reduce((s, item) => {
    const { totalHrs } = calcItem(item)
    return s + totalHrs * (item.qty || 1)
  }, 0).toFixed(2)
}
