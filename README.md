# B-Link — Frontend

B-Link è un sistema per la gestione delle donazioni di sangue sviluppato come project work universitario.
Questo repository contiene il **frontend**: un'applicazione web costruita con **Next.js 15** che si connette al backend NestJS (`b-link-backend`).

---

## Cos'è B-Link

B-Link offre un'interfaccia diversa per ogni ruolo:

- i **donatori** possono prenotare una donazione, compilare il questionario e scaricare i referti in PDF
- gli **operatori** gestiscono gli slot e registrano le donazioni al bancone
- i **medici** compilano i referti e revisionano i questionari pre-donazione
- gli **amministratori** hanno accesso completo a utenti, centri, parametri e statistiche

---

## Come avviare il progetto

Il frontend dipende dal backend. Avvia prima il backend, poi il frontend.

### Prerequisiti

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installato e avviato
- La repo `b-link-backend` clonata nella stessa cartella padre (es. `Progetti/b-link-backend` e `Progetti/b-link-frontend`)

### 1. Avvia il backend

```bash
cd b-link-backend
cp .env.example .env
RUN_SEED=true docker compose up --build -d
```

Aspetta qualche secondo che il seed finisca (puoi controllare con `docker compose logs -f api`).

### 2. Avvia il frontend

```bash
cd b-link-frontend
cp .env.docker .env
docker compose up --build -d
```

### URL

| Servizio | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger (documentazione API) | http://localhost:3000/api |
| MailHog (email fake) | http://localhost:8025 |

---

## Come accedere

### Donatore

I donatori possono registrarsi liberamente dalla pagina pubblica. In alternativa usa l'account demo:

| Campo | Valore |
|---|---|
| Email | `luca.bianchi@demo.it` |
| Password | `Demo1234!` |
| 2FA | Non richiesto |

Dopo il primo login potrebbe essere richiesto di completare l'onboarding (dati anagrafici e sanitari).

### Operatore

| Campo | Valore |
|---|---|
| Email | `op1.roma@blink.it` |
| Password | `Demo1234!` |
| 2FA | Obbligatorio — al primo accesso scansiona il QR code con Google Authenticator o Authy |

### Medico

| Campo | Valore |
|---|---|
| Email | `dr1.roma@blink.it` |
| Password | `Demo1234!` |
| 2FA | Obbligatorio — al primo accesso scansiona il QR code |

### Amministratore

| Campo | Valore |
|---|---|
| Email | `admin@b-link.it` |
| Password | `Admin1234!` |
| 2FA | Obbligatorio — al primo accesso scansiona il QR code |

> Le email di verifica e reset password vengono recapitate su MailHog (http://localhost:8025), non arrivano nella casella reale.

---

## Avvio senza Docker (sviluppo locale)

Se preferisci avviare il frontend direttamente con Node.js:

```bash
npm install
npm run dev
```

Il frontend si avvia su http://localhost:3001 e si aspetta il backend su http://localhost:3000.
Assicurati che il backend sia in esecuzione prima di avviare il frontend.

---

## Struttura del progetto

```
src/
  app/
    (auth)/           Pagine di login, registrazione, 2FA, reset password
    donors/           Area donatore (dashboard, prenotazioni, donazioni, profilo)
    operators/        Area operatore (slot, prenotazioni, donatori)
    doctors/          Area medico (referti, questionari, donatori)
    admin/            Area amministratore (utenti, centri, parametri, GDPR)
    page.tsx          Landing page pubblica
  components/         Componenti riusabili per ogni area
  lib/
    api/              Client HTTP (Axios) e funzioni di fetch
    types/            Tipi generati dall'OpenAPI del backend
    utils/            Utility (PDF referti, formatters, ecc.)
  proxy.ts            Middleware Next.js per la gestione dei cookie di autenticazione
```

---

## Stack tecnico

- **Next.js 15** — App Router, TypeScript, Turbopack
- **TailwindCSS** + **shadcn/ui** — componenti UI
- **TanStack Query** — data fetching e cache
- **Zustand** — stato autenticazione (access token in memoria, mai in localStorage)
- **React Hook Form** + **Zod** — form e validazione
- **jsPDF** — generazione PDF referti medici
