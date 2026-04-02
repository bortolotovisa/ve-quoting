# VE Quoting — Labour Hours Estimator

Sistema de orçamento de horas de labour para Visual Elements.
Rates calculados a partir de 15.735 work orders reais (Jan 2025 – Mar 2026).

---

## Deploy no Render.com (gratuito)

### PASSO 1 — Criar conta no GitHub (se ainda não tiver)
1. Acesse github.com → Sign up
2. Crie uma conta gratuita

---

### PASSO 2 — Colocar o projeto no GitHub

**Opção A — Usando GitHub Desktop (mais fácil, recomendado)**
1. Baixe o GitHub Desktop em desktop.github.com e instale
2. Abra o GitHub Desktop → File → Add Local Repository
3. Clique em "Choose..." e selecione a pasta `ve-quoting` que você descompactou
4. Se aparecer "This directory does not appear to be a Git repository", clique em **"create a repository"**
5. Name: `ve-quoting` → clique em **Create Repository**
6. No canto superior direito, clique em **"Publish repository"**
7. Desmarque "Keep this code private" se quiser (não importa para funcionar)
8. Clique em **Publish Repository**

**Opção B — Usando terminal**
```bash
cd ve-quoting
git init
git add .
git commit -m "Initial commit"
```
Depois vá em github.com → New repository → nome `ve-quoting` → Create.
```bash
git remote add origin https://github.com/SEU_USUARIO/ve-quoting.git
git branch -M main
git push -u origin main
```

---

### PASSO 3 — Criar conta no Render
1. Acesse render.com → Sign Up
2. Clique em **"GitHub"** para criar a conta conectada ao seu GitHub
3. Autorize o Render a acessar seus repositórios

---

### PASSO 4 — Criar o Web Service no Render
1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Clique em **"Connect a repository"**
3. Encontre `ve-quoting` na lista e clique em **Connect**
4. Preencha as configurações:
   - **Name:** `ve-quoting` (ou qualquer nome)
   - **Region:** Oregon (US West) — mais rápido para Canadá
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && cd client && npm install && npm run build`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** `Free` ✓
5. Clique em **"Create Web Service"**
6. Aguarde o build — leva 3 a 5 minutos na primeira vez
7. Quando aparecer **"Your service is live"**, clique no link gerado (ex: `ve-quoting.onrender.com`)

---

### PASSO 5 — Adicionar disco para salvar os quotes (importante!)
Sem isso, os quotes são apagados toda vez que o servidor reinicia.

1. No painel do seu serviço no Render, clique em **"Disks"** no menu lateral
2. Clique em **"Add Disk"**
3. Preencha:
   - **Name:** `ve-quoting-db`
   - **Mount Path:** `/app`
   - **Size:** `1 GB` (gratuito)
4. Clique em **"Save"**
5. O serviço vai reiniciar automaticamente — aguarde ~1 minuto

---

### PASSO 6 — Configurar variável de ambiente do banco
1. No painel do serviço, clique em **"Environment"** no menu lateral
2. Clique em **"Add Environment Variable"**
3. Preencha:
   - **Key:** `DB_PATH`
   - **Value:** `/app/quotes.db`
4. Clique em **"Save Changes"**
5. O serviço reinicia novamente — aguarde ~1 minuto

---

### Pronto!
Seu link ficará no formato: `https://ve-quoting.onrender.com`

**Atenção:** No plano gratuito do Render, o servidor "dorme" após 15 minutos sem uso.
A primeira visita depois de um período inativo pode demorar ~30 segundos para carregar.
Depois disso, funciona normalmente.

---

### Como fazer atualizações no futuro
Sempre que quiser atualizar o sistema:
1. Faça as mudanças nos arquivos
2. No GitHub Desktop: escreva uma mensagem em "Summary" → clique **Commit to main** → clique **Push origin**
3. O Render detecta automaticamente e faz o redeploy em ~2 minutos

---

## Desenvolvimento local
```bash
npm run install:all
npm run dev
```
Acesse: http://localhost:5173

---

## Stack
- **Backend**: Node.js + Express + better-sqlite3
- **Frontend**: React + Vite + React Router
- **Deploy**: Render.com (gratuito)
