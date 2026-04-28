# Infor History — Update Files

Three files to replace/add in the existing `ve-quoting` project.

## What changed

1. **Date bug fix** — dates like `07-Jan-202` now display as `07 Jan 2025`
2. **SaaS-style redesign** — clean header, search bar, filters, cards
3. **Variance gauge (Option A)** — mini directional bar with %
4. **Total row redesigned** — light background, blue accent for /unit
5. **Quick access chips** — recent + common searches above the bar
6. **Collapsed by default** — every part/WO starts closed, user expands
7. **Materials kept** — already good, no changes

---

## File placement

### 1. `HistorySearch.jsx`
**Path:** `client/src/pages/HistorySearch.jsx` (or wherever the existing one lives)

Just **replace** the existing file with this one.

### 2. `HistorySearch.module.css`
**Path:** same folder as the JSX (`client/src/pages/HistorySearch.module.css`)

Replace if it exists, create if not.

### 3. `dateFix.js`
**Path:** `server/dateFix.js`

This is a **new utility** that fixes the truncated dates at server startup.

In your `server/server.js` (or wherever you load the JSON), add at the top:

```js
const { fixTruncatedDates } = require('./dateFix')
```

Then where you currently do something like:

```js
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'infor_history.json')))
```

Add the fix line right after:

```js
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'infor_history.json')))
fixTruncatedDates(data)  // ← add this
```

That's it. On next server startup the dates will be repaired in memory.

---

## Expected backend API contract

The component calls `GET /api/history/search?q=<query>&closed=1` and expects:

```json
{
  "results": [
    {
      "part_num": "108630-00",
      "description": "W Curved Module - Center",
      "shop": "Metal",
      "has_bom": true,
      "wos": [
        {
          "id": "W52375/M",
          "s": "C",                    // Status: C=Closed, R=Released, blank=Open
          "d": "07-Jan-2025",           // Date (will be auto-fixed if truncated)
          "q": 4,                       // Qty
          "h": 42.71,                   // Actual hours
          "e": 66.67,                   // Estimated hours
          "ops": [
            { "n": "M-POLISHING", "h": 28.74, "e": 24.00 }
          ],
          "mats": [
            { "id": "30-1601", "d": "Sheet St/Steel 48\"", "q": 4, "c": 886 }
          ]
        }
      ]
    }
  ]
}
```

If the existing API already returns this shape, no backend change needed beyond adding the `dateFix` line.

---

## Quick test after deploy

1. Search for `108630` — should return "W Curved Module - Center"
2. Click the part card → WO list expands
3. Click WO `W52375/M` → details expand
4. **Date should show `07 Jan 2025`** (not `07-Jan-202`)
5. Variance column should show mini bar + percentage
6. Total row should have white/light background, NOT dark
7. Without searching, you should see "Common" chips below the search bar

---

## Known gotchas

- **CSS variable scope** — all CSS variables are scoped to `.page`, so they won't conflict with other pages
- **localStorage** — recent searches persist per browser; clearing storage resets them
- **Variance gauge cap** — visual fill caps at 50% width even if % > 100, so −82% and −300% look similar visually but the number is exact
- **Empty states** — if no estimate exists, the variance shows "no estimate" pill; this is correct behavior, not a bug
