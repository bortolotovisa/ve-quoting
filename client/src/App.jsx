import React from 'react'
import { Routes, Route } from 'react-router-dom'
import QuoteList from './pages/QuoteList'
import QuoteEditor from './pages/QuoteEditor'
import HistorySearch from './pages/HistorySearch'
import MaterialCalc from './pages/MaterialCalc'
import DrawingQuote from './pages/DrawingQuote'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuoteList />} />
      <Route path="/quote/new" element={<QuoteEditor />} />
      <Route path="/quote/:id" element={<QuoteEditor />} />
      <Route path="/history" element={<HistorySearch />} />
      <Route path="/materials" element={<MaterialCalc />} />
      <Route path="/drawing-quote" element={<DrawingQuote />} />
    </Routes>
  )
}
