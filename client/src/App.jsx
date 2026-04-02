import React from 'react'
import { Routes, Route } from 'react-router-dom'
import QuoteList from './pages/QuoteList'
import QuoteEditor from './pages/QuoteEditor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuoteList />} />
      <Route path="/quote/new" element={<QuoteEditor />} />
      <Route path="/quote/:id" element={<QuoteEditor />} />
    </Routes>
  )
}
