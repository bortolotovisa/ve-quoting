.page { max-width: 860px; margin: 0 auto; padding: 2.5rem 1.5rem; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.logoBlock { display: flex; flex-direction: column; gap: 3px; }

.logo { display: flex; align-items: center; gap: 10px; }

.logoMark {
  width: 32px; height: 32px;
  background: var(--accent);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font);
  font-size: 13px; font-weight: 600;
  color: #fff; letter-spacing: -.02em;
  flex-shrink: 0;
}

.logoText {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -.03em;
}

.sub {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text3);
}

.headerActions { display: flex; gap: 8px; align-items: center; }

.btnNew {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity .15s;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}
.btnNew:hover { opacity: .88; }

.btnHistory {
  background: var(--bg2);
  color: var(--text2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}
.btnHistory:hover { border-color: var(--border2); color: var(--text); }

.sectionLabel {
  font-size: 11px; font-weight: 500; color: var(--text3);
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px;
}

.searchBar {
  position: relative;
  margin-bottom: 10px;
}
.searchInput {
  width: 100%; font-size: 13px;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg2);
  color: var(--text);
  box-shadow: var(--shadow-sm);
  transition: border-color .15s, box-shadow .15s;
}
.searchInput:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  outline: none;
}
.searchInput::placeholder { color: var(--text3); }
.clearBtn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; font-size: 16px; color: var(--text3);
  cursor: pointer; line-height: 1; padding: 0 2px;
  transition: color .15s;
}
.clearBtn:hover { color: var(--text); }

.clientChips {
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;
}
.chip {
  font-size: 12px; padding: 3px 12px;
  border: 1px solid var(--border); border-radius: 20px;
  background: var(--bg2); color: var(--text2);
  cursor: pointer; transition: all .15s;
  box-shadow: var(--shadow-sm);
}
.chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }
.chipActive { background: var(--accent-bg) !important; color: var(--accent) !important; border-color: var(--accent) !important; }

.empty {
  text-align: center;
  padding: 5rem 1rem;
  color: var(--text3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  font-size: 14px;
  background: var(--bg2);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 18px;
  background: var(--bg2);
  cursor: pointer;
  transition: background .1s;
  gap: 1rem;
  flex-wrap: wrap;
}
.row:hover { background: var(--bg3); }

.rowLeft { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }

.rowName {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -.01em;
}

.rowClient {
  font-size: 11px;
  color: var(--text3);
  background: var(--bg3);
  padding: 2px 8px;
  border-radius: 20px;
  border: 1px solid var(--border);
  white-space: nowrap;
}

.rowMeta { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.rowItems { font-size: 12px; color: var(--text3); }

.rowHrs {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  min-width: 52px;
  text-align: right;
}

.rowDate { font-size: 12px; color: var(--text3); min-width: 82px; text-align: right; }

.btnDel {
  background: none; border: none;
  font-size: 16px; color: var(--text3);
  padding: 0 2px; line-height: 1;
  transition: color .15s; border-radius: 4px;
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
}
.btnDel:hover { color: var(--danger); background: #FEF2F2; }
