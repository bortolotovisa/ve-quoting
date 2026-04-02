# VE Quoting — Labour Hours Estimator

Sistema de orçamento de horas de labour para Visual Elements.
Rates calculados a partir de 15.735 work orders reais (Jan 2025 – Mar 2026).

## Deploy no Railway

### 1. Criar repositório no GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/ve-quoting.git
git push -u origin main
```

### 2. Criar projeto no Railway
1. Acesse railway.app → New Project → Deploy from GitHub repo
2. Selecione o repositório `ve-quoting`
3. Railway detecta o `nixpacks.toml` e faz o build automaticamente

### 3. Variáveis de ambiente no Railway
Não são obrigatórias para funcionar. Opcionalmente:
- `PORT` → Railway define automaticamente
- `DB_PATH` → caminho do banco SQLite (default: `./quotes.db`)

### 4. Volume para persistência do banco
No Railway, vá em Settings → Volumes → Add Volume:
- Mount path: `/app`
- Isso garante que o banco SQLite não seja perdido em redeploys

### Desenvolvimento local
```bash
npm run install:all
npm run dev
```
Acesse: http://localhost:5173

## Stack
- **Backend**: Node.js + Express + better-sqlite3
- **Frontend**: React + Vite + React Router
- **Deploy**: Railway + nixpacks
