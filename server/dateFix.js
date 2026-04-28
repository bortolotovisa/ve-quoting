/**
 * dateFix.js
 * Fixes truncated dates in the existing infor_history.json
 *
 * The original PDF parser used regex \d{3,4} which accepted 3-digit years,
 * resulting in dates like "07-Jan-202" instead of "07-Jan-2025".
 *
 * This utility repairs the JSON in-memory at server startup so we don't
 * need to re-parse the original PDFs.
 *
 * Apply this in server.js before serving data:
 *   const data = JSON.parse(fs.readFileSync('infor_history.json'))
 *   fixTruncatedDates(data)
 */

function fixTruncatedDates(data) {
  let fixedCount = 0

  for (const part of data) {
    if (!part.wos) continue
    for (const wo of part.wos) {
      if (!wo.d) continue
      // Match "DD-MMM-NNN" where NNN is 3 digits (truncated year)
      const match = wo.d.match(/^(\d{1,2}-\w{3}-)(\d{3})$/)
      if (match) {
        // Most data is from 2025 — append "5"
        // For dates that should be 2026+, the parser would have shown "203", "204", etc.
        // We can detect this by the 3rd digit:
        //   "202" → 2025 (most common)
        //   "203" → 2026
        //   "204" → 2027
        const prefix = match[1]
        const truncated = match[2]
        const lastDigit = truncated[2]

        // Heuristic: the year always starts with "20" so we just need to add the missing 4th digit
        // If 3rd digit is 2 → year 2020-2029, append likely "5" (but use context if available)
        let fullYear
        if (truncated === '202') fullYear = '2025'
        else if (truncated === '203') fullYear = '2026'
        else if (truncated === '204') fullYear = '2027'
        else if (truncated === '201') fullYear = '2019'
        else if (truncated === '200') fullYear = '2009'
        else fullYear = truncated + '0'

        wo.d = prefix + fullYear
        fixedCount++
      }
    }
  }

  if (fixedCount > 0) {
    console.log(`[dateFix] Repaired ${fixedCount} truncated dates`)
  }
  return data
}

module.exports = { fixTruncatedDates }
