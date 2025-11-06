# ONE-M ENERGY SOLUTIONS - Gestione Manutenzioni

Sistema web completo per la gestione di report di manutenzione e interventi tecnici su impianti industriali, con generazione automatica di PDF professionali.

## 🎯 Features

- 🔐 **Autenticazione sicura** - Sistema di login con ruoli (Admin/Collaboratore)
- 🏭 **Gestione Impianti** - Creazione e gestione di impianti con proprietà e componenti
- 🔧 **Report Manutenzione** - Checklist strutturate per manutenzione ordinaria con componenti predefiniti
- 🧰 **Report Interventi** - Report liberi per interventi tecnici con descrizioni personalizzate
- 📸 **Upload Foto** - Caricamento multiplo di foto per ogni attività (max 5 foto per attività)
- 📄 **Generazione PDF** - Creazione automatica di PDF professionali con logo aziendale
- 📁 **Archivio Avanzato** - Sistema di archiviazione con filtri multipli e paginazione
- ⚙️ **Area Amministrazione** - Gestione impostazioni aziendali, logo e utenti (solo Admin)
- 👥 **Gestione Utenti** - CRUD completo utenti con validazioni e protezioni
- 🎨 **UI Moderna** - Interfaccia responsive con Tailwind CSS e componenti ottimizzati

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4
- **PDF Generation**: PDFKit
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Deployment**: Render / Vercel

## 📋 Requisiti

- Node.js 20+
- PostgreSQL 14+
- npm o yarn

## 🚀 Installazione Locale

### 1. Clone del Repository

```bash
git clone https://github.com/Matluc88/gestione-manutenzioni.git
cd gestione-manutenzioni
```

### 2. Installazione Dipendenze

```bash
npm install
```

### 3. Setup Database

Crea un database PostgreSQL:

```bash
# Usando psql
createdb onem_energy

# Oppure tramite GUI (pgAdmin, TablePlus, etc.)
```

### 4. Configurazione Variabili d'Ambiente

Copia il file `.env.example` in `.env` e modifica i valori:

```bash
cp .env.example .env
```

Modifica `.env` con i tuoi valori:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/onem_energy"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Per generare `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 5. Migrazione Database

```bash
npx prisma migrate dev
```

### 6. Seed Database (Opzionale)

Popola il database con dati di esempio:

```bash
npx prisma db seed
```

Questo creerà:
- Utente admin: `admin` / `admin123`
- Impostazioni aziendali di default
- Componenti predefiniti di esempio

### 7. Avvio Server di Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 👤 Credenziali Default

Dopo il seed:

- **Admin**: `admin` / `admin123`
- **Collaboratore**: Crea tramite pannello admin (Impostazioni → Gestione Utenti)

## 🔑 Ruoli Utente

### Collaboratore
- Accesso a Dashboard
- Creazione report manutenzione e interventi
- Visualizzazione archivio (solo propri report)
- Upload foto
- Generazione PDF

### Admin
- Tutti i permessi del Collaboratore
- Accesso a Impostazioni
- Gestione dati aziendali e logo
- Gestione utenti (CRUD completo)
- Gestione impianti (CRUD completo)
- Visualizzazione archivio (tutti i report)
- Eliminazione report

## 📖 Guida Utilizzo

### Creazione Report Manutenzione

1. Dashboard → Click "Manutenzione"
2. Seleziona impianto dalla lista
3. Il sistema carica automaticamente i componenti dell'impianto
4. Per ogni componente, compila:
   - Stato: FATTO / NON_FATTO / NON_APPLICABILE
   - Motivazione (obbligatoria se NON_FATTO)
   - Note (opzionale)
   - Foto (max 5 per attività)
5. Click "Salva bozza" per salvare senza completare
6. Click "Genera PDF" per finalizzare e scaricare il report

### Creazione Report Intervento

1. Dashboard → Click "Intervento"
2. Seleziona impianto
3. Click "Inserisci attività" per aggiungere righe
4. Per ogni attività:
   - Descrizione intervento
   - Note (opzionale)
   - Foto (max 5)
5. Click "Fine attività → Genera PDF"

### Gestione Archivio

1. Dashboard → Click "Archivio"
2. Usa filtri per cercare:
   - Testo libero (codice report, nome impianto)
   - Tipo report (Manutenzione/Intervento)
   - Stato (Bozza/Completato)
   - Operatore (solo admin)
   - Range date
3. Click 👁️ per visualizzare dettagli
4. Click 📄 per scaricare PDF
5. Click 🗑️ per eliminare (solo admin)

### Gestione Impostazioni (Admin)

**Dati Azienda:**
- Nome azienda
- Indirizzo
- Telefono
- Email
- Intestazione PDF personalizzata

**Logo:**
- Upload logo aziendale (PNG/JPG, max 5MB)
- Preview in tempo reale
- Appare su tutti i PDF generati

**Gestione Utenti:**
- Crea nuovi utenti
- Modifica username, password, ruolo
- Attiva/Disattiva utenti
- Elimina utenti (solo se senza report associati)
- Protezioni: non puoi eliminare/disattivare te stesso

## 🔒 Sicurezza

- ✅ Password hashate con bcrypt
- ✅ Autenticazione JWT tramite NextAuth
- ✅ Protezione API con controlli sessione
- ✅ Controlli ruolo (ADMIN/COLLABORATORE)
- ✅ Validazione input client e server
- ✅ Prevenzione SQL injection (Prisma ORM)
- ✅ Prevenzione XSS (React escaping)
- ✅ Validazione upload file (tipo, dimensione)
- ✅ Protezione eliminazione accidentale

## 🚀 Deploy su Render

### 1. Preparazione

Assicurati che il codice sia committato e pushato su GitHub.

### 2. Crea Database PostgreSQL

1. Vai su [render.com](https://render.com)
2. New → PostgreSQL
3. Nome: `onem-energy-db`
4. Copia l'**Internal Database URL**

### 3. Crea Web Service

1. New → Web Service
2. Connetti repository GitHub
3. Configurazione:
   - **Name**: `onem-energy-app`
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 4. Variabili d'Ambiente

Aggiungi in Environment Variables:

```
DATABASE_URL=<Internal Database URL da step 2>
NEXTAUTH_SECRET=<genera con: openssl rand -base64 32>
NEXTAUTH_URL=https://onem-energy-app.onrender.com
```

### 5. Deploy

Click "Create Web Service" - il deploy partirà automaticamente.

### 6. Seed Database (Prima volta)

Dopo il primo deploy, esegui il seed:

1. Render Dashboard → Shell
2. Esegui: `npx prisma db seed`

Ora puoi accedere con `admin` / `admin123`

## 📝 Scripts Disponibili

```bash
npm run dev          # Avvia server sviluppo
npm run build        # Build produzione
npm start            # Avvia server produzione
npm run lint         # Esegui ESLint
npx prisma studio    # Apri Prisma Studio (GUI database)
npx prisma migrate dev --name <nome>  # Crea nuova migration
npx prisma db seed   # Popola database con dati esempio
```

## 🐛 Troubleshooting

### Errore "Database connection failed"

Verifica che:
- PostgreSQL sia in esecuzione
- `DATABASE_URL` in `.env` sia corretta
- Il database esista

### Errore "NEXTAUTH_SECRET is not set"

Genera e aggiungi `NEXTAUTH_SECRET` in `.env`:

```bash
openssl rand -base64 32
```

### PDF non si genera

Verifica che:
- La cartella `public/pdf/` esista e sia scrivibile
- Le foto siano state caricate correttamente
- Non ci siano errori nella console

### Upload foto fallisce

Verifica che:
- La cartella `/data/uploads/` esista e sia scrivibile (su Render: configurare Render Disk montato su `/data`)
- Il file sia < 10MB
- Il formato sia JPG/PNG/WEBP

## 📄 Licenza

Progetto privato - Tutti i diritti riservati

## 👨‍💻 Autore

Sviluppato per ONE-M ENERGY SOLUTIONS

## 📞 Supporto

Per supporto, contattare: matteo.luceri2@gmail.com
