.page { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem 6rem; }
.loading { display:flex; align-items:center; justify-content:center; height:100vh; color:var(--text3); font-size:13px; }

.topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
.backBtn { background:none; border:none; font-size:13px; color:var(--text3); padding:0; cursor:pointer; transition:color .15s; display:flex; align-items:center; gap:4px; }
.backBtn:hover { color:var(--text); }
.saveStatus { font-family:var(--font-mono); font-size:11px; }
.saving { color:var(--text3); }
.saved { color:var(--wood); }

.quoteHeader {
  display:flex; justify-content:space-between; align-items:flex-start;
  gap:1rem; margin-bottom:1.5rem; padding:20px 24px;
  background:var(--bg2); border:1px solid var(--border);
  border-radius:var(--radius-xl); box-shadow:var(--shadow-sm);
  flex-wrap:wrap;
}
.headerLeft { display:flex; flex-direction:column; gap:8px; flex:1; min-width:200px; }
.nameInput {
  font-size:22px; font-weight:600; letter-spacing:-.03em;
  border:none; border-radius:0; padding:2px 0;
  background:transparent; color:var(--text); box-shadow:none;
}
.nameInput:focus { border:none; box-shadow:none; outline:none; }
.nameInput::placeholder { color:var(--text3); font-weight:400; }
.clientInput {
  font-size:13px; border:none; border-radius:0; padding:2px 0;
  background:transparent; color:var(--text2); max-width:280px; box-shadow:none;
}
.clientInput:focus { border:none; box-shadow:none; outline:none; }
.clientInput::placeholder { color:var(--text3); }
.headerRight { display:flex; align-items:center; gap:16px; flex-shrink:0; }
.totalBlock { text-align:right; }
.totalLabel { font-size:11px; color:var(--text3); display:block; margin-bottom:2px; text-transform:uppercase; letter-spacing:.05em; font-weight:500; }
.totalHrs { font-family:var(--font-mono); font-size:26px; font-weight:500; color:var(--text); letter-spacing:-.02em; }
.totalUnit { font-size:14px; font-weight:400; color:var(--text3); margin-left:2px; }

.addBtn {
  background:var(--accent); color:#fff;
  border:none; border-radius:var(--radius);
  padding:8px 16px; font-size:13px; font-weight:500;
  cursor:pointer; transition:opacity .15s; white-space:nowrap;
  box-shadow:var(--shadow-sm);
}
.addBtn:hover { opacity:.88; }

.items { display:flex; flex-direction:column; gap:10px; }
.emptyItems {
  text-align:center; padding:3rem; color:var(--text3);
  display:flex; flex-direction:column; align-items:center; gap:1rem;
  border:1px dashed var(--border); border-radius:var(--radius-xl);
  background:var(--bg2);
}

.card {
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:var(--radius-xl);
  overflow:hidden;
  box-shadow:var(--shadow-sm);
  transition:box-shadow .15s;
}
.card:hover { box-shadow:var(--shadow); }

.cardHeader {
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 16px;
  background:var(--bg3);
  border-bottom:1px solid var(--border);
}
.itemNum {
  font-family:var(--font-mono); font-size:11px; font-weight:500;
  color:var(--text3); letter-spacing:.04em;
}
.removeItemBtn { background:none; border:none; font-size:12px; color:var(--text3); cursor:pointer; transition:color .15s; }
.removeItemBtn:hover { color:var(--danger); }

.fieldRow { display:grid; grid-template-columns:1fr 1fr auto; gap:10px; padding:14px 16px 0; align-items:end; }
.fieldDesc { grid-column:span 1; }
.fieldQty { min-width:76px; }
.lbl { display:block; font-size:11px; font-weight:500; color:var(--text3); margin-bottom:4px; }
.removedNote { color:var(--warn); font-weight:400; font-size:11px; }

.cardDivider { border:none; border-top:1px solid var(--border); margin:14px 0 0; }
.cardBody { display:grid; grid-template-columns:1fr 1fr; gap:0; }
@media (max-width:640px) {
  .cardBody { grid-template-columns:1fr; }
  .fieldRow { grid-template-columns:1fr 1fr; }
  .fieldDesc { grid-column:span 2; }
}

.leftCol { padding:14px 16px; border-right:1px solid var(--border); }
.rightCol { padding:14px 16px; }

.shopToggle { display:flex; gap:6px; margin-bottom:14px; }
.shopBtn {
  flex:1; padding:7px 10px;
  font-size:13px; font-weight:500;
  border-radius:var(--radius); border:1px solid var(--border);
  background:var(--bg3); color:var(--text2); cursor:pointer; transition:all .15s;
}
.shopBtn:hover { background:var(--bg4); }
.shopMetal { background:var(--metal-bg) !important; color:var(--metal) !important; border-color:var(--metal-bdr) !important; }
.shopWood  { background:var(--wood-bg)  !important; color:var(--wood)  !important; border-color:var(--wood-bdr)  !important; }

.procList { display:flex; flex-direction:column; gap:4px; }
.procRow {
  display:flex; align-items:center; gap:8px;
  padding:7px 10px; border-radius:var(--radius);
  border:1px solid var(--border); background:var(--bg3); transition:all .12s;
}
.metalOn { background:var(--metal-bg); border-color:var(--metal-bdr); }
.woodOn  { background:var(--wood-bg);  border-color:var(--wood-bdr); }
.addonOn { background:var(--warn-bg);  border-color:var(--warn-bdr); }
.removed { background:transparent; border-color:var(--border); opacity:.45; }

.procName { font-size:12px; font-weight:500; flex:1; min-width:0; color:var(--text2); }
.metalOn .procName { color:var(--metal); }
.woodOn  .procName { color:var(--wood); }
.addonOn .procName { color:var(--warn); }
.removed .procName { color:var(--text3); text-decoration:line-through; }

.procAwo { font-family:var(--font-mono); font-size:10px; color:var(--text3); white-space:nowrap; flex-shrink:0; }

.cxPills { display:flex; gap:3px; flex-shrink:0; }
.cxPill {
  font-family:var(--font-mono); font-size:10px; font-weight:500;
  padding:2px 7px; border-radius:20px;
  border:1px solid var(--border); cursor:pointer;
  background:transparent; color:var(--text3); transition:all .12s;
}
.cxS { background:var(--wood-bg); color:var(--wood); border-color:var(--wood-bdr); }
.cxM { background:var(--warn-bg); color:var(--warn); border-color:var(--warn-bdr); }
.cxC { background:#FEF2F2; color:var(--danger); border-color:#FECACA; }

.removeBtn {
  font-size:11px; font-weight:500; padding:2px 8px; border-radius:var(--radius);
  border:1px solid var(--border); cursor:pointer;
  background:transparent; color:var(--text3); transition:all .12s; flex-shrink:0;
}
.removeBtn:hover { background:#FEF2F2; color:var(--danger); border-color:#FECACA; }
.addBackBtn {
  font-size:11px; padding:2px 8px; border-radius:var(--radius);
  border:1px dashed var(--border); cursor:pointer;
  background:transparent; color:var(--text3); transition:all .12s; flex-shrink:0;
}
.addBackBtn:hover { border-color:var(--border2); color:var(--text2); }

.addonSep {
  font-size:11px; font-weight:500; color:var(--text3);
  margin-top:12px; margin-bottom:6px; padding-top:12px;
  border-top:1px dashed var(--border);
}

.resultBlock { background:var(--bg3); border-radius:var(--radius-lg); border:1px solid var(--border); padding:12px 14px; }
.noProcs { font-size:12px; color:var(--text3); padding:6px 0; }

.resultLine {
  display:flex; justify-content:space-between; align-items:center;
  padding:5px 0; border-bottom:1px solid var(--border); gap:6px;
}
.resultLine:last-of-type { border-bottom:none; }
.resultName { font-size:12px; color:var(--text2); display:flex; align-items:center; gap:5px; flex:1; min-width:0; }
.resultHrs { font-family:var(--font-mono); font-size:12px; font-weight:500; color:var(--text); flex-shrink:0; }

.cxTag { font-family:var(--font-mono); font-size:10px; font-weight:500; padding:1px 5px; border-radius:10px; }
.cxTagS { background:var(--wood-bg); color:var(--wood); }
.cxTagM { background:var(--warn-bg); color:var(--warn); }
.cxTagC { background:#FEF2F2; color:var(--danger); }
.addonTag { font-family:var(--font-mono); font-size:9px; background:var(--warn-bg); color:var(--warn); padding:1px 5px; border-radius:10px; text-transform:uppercase; letter-spacing:.04em; }

.resultTotal { display:flex; justify-content:space-between; align-items:baseline; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); }

.summary {
  background:var(--bg2); border:1px solid var(--border);
  border-radius:var(--radius-xl); padding:18px 20px; margin-top:1.5rem;
  box-shadow:var(--shadow-sm);
}
.summaryTitle { font-size:11px; font-weight:500; color:var(--text3); margin-bottom:12px; text-transform:uppercase; letter-spacing:.05em; }
.sumRow { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.sumRow:last-of-type { border-bottom:none; }
.shopDot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.dotMetal { background:var(--metal); }
.dotWood  { background:var(--wood); }
.sumDesc { font-size:13px; font-weight:500; color:var(--text); flex:1; min-width:100px; letter-spacing:-.01em; }
.sumInfo { font-family:var(--font-mono); font-size:11px; color:var(--text3); }
.sumHrs  { font-family:var(--font-mono); font-size:13px; font-weight:500; color:var(--text); min-width:52px; text-align:right; }
.sumTotal { display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px solid var(--border); font-size:13px; color:var(--text2); }
.sumNote { font-family:var(--font-mono); font-size:11px; color:var(--text3); margin-top:6px; }

.shopBreakdown {
  display: flex; flex-direction: column; gap: 4px;
  margin: 8px 0; padding: 8px 0;
  border-top: 1px solid var(--border2);
  border-bottom: 1px solid var(--border2);
}
.shopLine {
  display: flex; align-items: center; gap: 8px;
}
.shopName { font-size: 12px; color: var(--text2); flex: 1; }
.shopHrs { font-family: var(--font-mono); font-size: 12px; font-weight: 500; color: var(--text); }
