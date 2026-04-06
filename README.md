# VE Quoting — Labour Hours Estimator

Sistema de orçamento de horas de labour para Visual Elements.
Rates calculados a partir de 15.735 work orders reais (Jan 2025 – Mar 2026).

---

## Deploy no Render.com (100% gratuito)

### PASSO 1 — GitHub Desktop
1. Baixe o GitHub Desktop em desktop.github.com e instale
2. Faça login com sua conta GitHub (ou crie uma em github.com)
3. No GitHub Desktop: File → Add Local Repository
4. Clique em "Choose..." e selecione a pasta `ve-quoting`
5. Se aparecer "This directory does not appear to be a Git repository" → clique em "create a repository"
6. Name: `ve-quoting` → Create Repository
7. Clique em "Publish repository" (canto superior direito)
8. Clique em "Publish Repository" (pode deixar público)

---

### PASSO 2 — Criar conta no Render
1. Acesse render.com → Sign Up
2. Clique em "GitHub" para criar a conta conectada ao GitHub
3. Autorize o Render

---

### PASSO 3 — Criar o banco PostgreSQL GRATUITO
Isso é feito ANTES do web service.

1. No dashboard do Render → clique em "New +" → "PostgreSQL"
2. Preencha:
   - Name: `ve-quoting-db`
   - Region: Oregon (US West)
   - Instance Type: **Free** ✓
3. Clique em "Create Database"
4. Aguarde ~1 minuto até o status ficar "Available"
5. Na página do banco, role para baixo até "Connections"
6. Copie o campo **"Internal Database URL"** — você vai precisar no próximo passo

---

### PASSO 4 — Criar o Web Service
1. No dashboard → "New +" → "Web Service"
2. Clique em "Connect a repository" → selecione `ve-quoting` → Connect
3. Preencha:
   - **Name:** `ve-quoting`
   - **Region:** Oregon (US West) — mesma região do banco!
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && cd client && npm install && npm run build`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** **Free** ✓
4. Antes de criar, role para baixo até "Environment Variables"
5. Clique em "Add Environment Variable":
   - Key: `DATABASE_URL`
   - Value: cole aqui o "Internal Database URL" que você copiou no Passo 3
6. Adicione outra variável:
   - Key: `NODE_ENV`
   - Value: `production`
7. Clique em "Create Web Service"
8. Aguarde o build — leva 3 a 5 minutos
9. Quando aparecer "Your service is live" → clique no link (ex: ve-quoting.onrender.com)

---

### Pronto!
Seu link: `https://ve-quoting.onrender.com`

**Atenção:** No plano gratuito o servidor "dorme" após 15 min sem uso.
A primeira visita depois de inativo demora ~30 segundos. Depois funciona normalmente.

O banco PostgreSQL gratuito do Render expira após 90 dias — eles enviam um email avisando.
Basta criar um novo banco e atualizar a variável DATABASE_URL.

---

### Como atualizar o sistema no futuro
1. Faça as mudanças nos arquivos
2. GitHub Desktop → escreva uma mensagem em "Summary" → "Commit to main" → "Push origin"
3. O Render detecta e faz o redeploy automaticamente em ~2 minutos

---

## Desenvolvimento local
Crie um arquivo `.env` na raiz com:
```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/ve_quoting
```
Depois:
```bash
npm run install:all
npm run dev
```
Acesse: http://localhost:5173

---

## Stack
- **Backend**: Node.js + Express + PostgreSQL (pg)
- **Frontend**: React + Vite + React Router
- **Deploy**: Render.com (gratuito)
