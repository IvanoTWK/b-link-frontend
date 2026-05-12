# B-Link — Frontend

Frontend Next.js 15 del sistema **B-Link** per la gestione delle donazioni di sangue.  
Si connette al backend NestJS disponibile nella repo `b-link-backend`.

---

## Avvio con Docker (consigliato)

> Assicurarsi che il backend sia già in esecuzione prima di avviare il frontend.

### 1. Avviare il backend

```bash
cd b-link-backend
docker compose up --build -d

# Solo al primo avvio — seed del database:
docker exec b-link-backend-api-1 npx prisma db seed

# Solo al primo avvio — abilitare l'estensione pgcrypto:
docker exec b-link-backend-db-1 sh -c "psql \$POSTGRES_USER -d blink_db -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'"
```

### 2. Avviare il frontend

```bash
cd b-link-frontend
cp .env.docker .env        # copia le variabili d'ambiente
docker compose up --build -d
```

### URL di accesso

| Servizio | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| MailHog (email fake) | http://localhost:8025 |

---

## Avvio in sviluppo (senza Docker)

```bash
npm install
npm run dev
```

Aprire [http://localhost:3001](http://localhost:3001).  
Richede il backend in esecuzione su `http://localhost:3000` (vedi `.env.local`).

---

## Accesso alla piattaforma

### Donatore

I donatori possono **registrarsi liberamente** dalla pagina pubblica (`/auth/register`).  
In alternativa è disponibile un account di test pre-caricato dal seed:

| Campo | Valore |
|---|---|
| Email | `luca.bianchi@demo.it` |
| Password | `Demo1234!` |
| 2FA | Non richiesto |

> Dopo il login, completare l'onboarding inserendo i dati anagrafici e sanitari se richiesto.

---

### Operatore (Staff)

Gli account operatore sono creati dall'amministratore. Account di test disponibile:

| Campo | Valore |
|---|---|
| Email | `op1.roma@blink.it` |
| Password | `Demo1234!` |
| 2FA | **Obbligatorio** — al primo accesso verrà richiesto il setup tramite app TOTP (es. Google Authenticator, Authy) |

---

### Medico (Doctor)

| Campo | Valore |
|---|---|
| Email | `dr1.roma@blink.it` |
| Password | `Demo1234!` |
| 2FA | **Obbligatorio** — al primo accesso verrà richiesto il setup tramite app TOTP |

---

### Amministratore

| Campo | Valore |
|---|---|
| Email | `admin@blink.local` |
| Password | `Admin1234!` |
| 2FA | **Obbligatorio** — al primo accesso verrà richiesto il setup tramite app TOTP |

---

## Note sul 2FA

Il personale sanitario (operatori, medici, admin) è soggetto a **2FA obbligatorio**.  
Al primo accesso verrà mostrata una pagina di setup con QR code da scansionare con un'app TOTP.  
Le email di verifica e reset password vengono recapitate su **MailHog** (`http://localhost:8025`).

---

## Stack tecnico

- **Next.js 15** — App Router, TypeScript, Turbopack
- **TailwindCSS** + **shadcn/ui** — UI components
- **TanStack Query** — data fetching e cache
- **Zustand** — gestione stato autenticazione
- **React Hook Form** + **Zod** — form e validazione
- **jsPDF** — generazione PDF referti medici
