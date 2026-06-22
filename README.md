# B-Link — Frontend

B-Link è un sistema per la gestione delle donazioni di sangue, sviluppato come project work universitario.  
Questo repository contiene il **frontend**: un'applicazione web realizzata con **Next.js 15** che si connette al backend NestJS disponibile nella repository `b-link-backend`.

---

## Descrizione del sistema

L'interfaccia è strutturata in quattro aree distinte, una per ciascun ruolo:

- **Donatore** — prenotazione degli slot, compilazione del questionario anamnestico, visualizzazione e download dei referti in PDF
- **Operatore** — gestione degli slot disponibili, registrazione delle donazioni, consultazione dei donatori del proprio centro
- **Medico** — compilazione dei referti medici, revisione dei questionari pre-donazione, ricerca profili donatori
- **Amministratore** — gestione di utenti, centri, tipi di donazione, parametri di laboratorio, consensi e audit log

---

## Avvio con Docker

Il frontend dipende dal backend. È necessario avviare prima il backend e attendere il completamento del seed, quindi avviare il frontend.

### Prerequisiti

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installato e in esecuzione
- Le due repository (`b-link-backend` e `b-link-frontend`) clonate nella stessa cartella

### 1. Avvio del backend

```bash
cd b-link-backend
cp .env.example .env
# Inserire i segreti JWT e PHI_ENCRYPTION_KEY nel file .env
RUN_SEED=true docker compose up --build -d
```

### 2. Avvio del frontend

```bash
cd b-link-frontend
cp .env.local.example .env
docker compose up --build -d
```

### Indirizzi

| Servizio | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Documentazione Swagger | http://localhost:3000/api |
| MailHog (visualizzazione email) | http://localhost:8025 |

---

## Avvio senza Docker

```bash
npm install
npm run dev
```

Il frontend si avvia su `http://localhost:3001` e richiede il backend in esecuzione su `http://localhost:3000`.

---

## Accesso alla piattaforma

### Donatore

I donatori possono registrarsi autonomamente dalla pagina pubblica. È disponibile anche un account dimostrativo precaricato dal seed:

| Campo | Valore |
|---|---|
| Email | `luca.bianchi@demo.it` |
| Password | `Demo1234!` |
| 2FA | Non richiesto |

### Operatore

| Campo | Valore |
|---|---|
| Email | `op1.roma@blink.it` |
| Password | `Demo1234!` |
| 2FA | Obbligatorio — al primo accesso configurare tramite app TOTP (Google Authenticator, Authy o equivalenti) |

### Medico

| Campo | Valore |
|---|---|
| Email | `dr1.roma@blink.it` |
| Password | `Demo1234!` |
| 2FA | Obbligatorio — al primo accesso configurare tramite app TOTP |

### Amministratore

| Campo | Valore |
|---|---|
| Email | `admin@b-link.it` |
| Password | `Admin1234!` |
| 2FA | Obbligatorio — al primo accesso configurare tramite app TOTP |

> Le email di sistema (verifica account, reset password, promemoria) non vengono inviate a caselle reali ma sono visibili su **MailHog** — http://localhost:8025

---

## Struttura del progetto

```
src/
  app/
    (auth)/           Pagine di autenticazione (login, registrazione, 2FA, reset password)
    donors/           Area donatore
    operators/        Area operatore
    doctors/          Area medico
    admin/            Area amministratore
    page.tsx          Landing page pubblica
  components/         Componenti UI riutilizzabili per ciascuna area
  lib/
    api/              Client HTTP (Axios) con interceptor per il refresh token
    types/            Tipi TypeScript generati dalla specifica OpenAPI del backend
    utils/            Utility condivise (generazione PDF, formattatori, ecc.)
  proxy.ts            Middleware Next.js per la gestione dei cookie di autenticazione
```

---

## Stack tecnologico

| Componente | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI | TailwindCSS + shadcn/ui |
| Data fetching | TanStack Query |
| Stato autenticazione | Zustand (access token in memoria) |
| Form e validazione | React Hook Form + Zod |
| Generazione PDF | jsPDF |
