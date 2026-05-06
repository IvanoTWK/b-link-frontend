'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Droplets,
  FlaskConical,
  Microscope,
  Layers,
  Shield,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  UserCheck,
  ArrowRight,
  Heart,
  Lightbulb,
  CheckCircle2,
  Building2,
  Clock,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth.store'
import { ROLE_REDIRECT } from '@/lib/auth/constants'
import { refreshClient } from '@/lib/api/axios'
import type { AuthMeResponse } from '@/lib/types'

// ── Dati ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '3+', label: 'Tipologie di donazione', icon: Droplets },
  { value: '100%', label: 'Digitale e paperless', icon: ClipboardList },
  { value: 'GDPR', label: 'Compliant by design', icon: Shield },
  { value: '24/7', label: 'Accesso al tuo storico', icon: Clock },
]

const FEATURES_DONOR = [
  'Prenota una donazione in pochi clic',
  'Visualizza il tuo storico donazioni',
  'Scarica i referti medici in PDF',
  'Gestisci il tuo profilo sanitario',
  'Ricevi promemoria via email',
]

const FEATURES_OPERATOR = [
  'Gestisci slot e disponibilità del centro',
  'Monitora le prenotazioni in tempo reale',
  'Controlla i dati dei donatori',
  'Dashboard con statistiche operative',
  'Validazione automatica dei requisiti',
]

const FEATURES_DOCTOR = [
  'Scheda clinica completa per ogni donatore',
  'Compila referti con parametri esame',
  'Gestisci esclusioni e note cliniche',
  'Accesso ai dati anamnestici',
  'Dashboard referti giornalieri',
]

const DONATION_TYPES = [
  {
    code: 'SI',
    name: 'Sangue Intero',
    icon: Droplets,
    gradient: 'from-red-500 to-rose-700',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    tip: 'Sapevi che donare sangue intero richiede solo 30–45 minuti? Il tuo organismo rigenera i globuli rossi in poche settimane e ogni donazione può salvare fino a 3 vite.',
    interval: 'Ogni 90 giorni (uomo) / 180 giorni (donna)',
    duration: '30–45 min',
  },
  {
    code: 'PL',
    name: 'Plasma',
    icon: FlaskConical,
    gradient: 'from-amber-400 to-orange-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    tip: 'Sapevi che il plasma costituisce il 55% del tuo sangue ed è usato per trattare oltre 50 malattie rare? A differenza dei globuli rossi, può essere conservato fino a 2 anni.',
    interval: 'Ogni 14 giorni (max 13 volte/anno)',
    duration: '45–60 min',
  },
  {
    code: 'PT',
    name: 'Piastrine',
    icon: Microscope,
    gradient: 'from-cyan-400 to-blue-600',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    tip: 'Sapevi che le piastrine durano solo 5–7 giorni dal prelievo? La tua donazione è immediatamente preziosa per pazienti oncologici e in chemioterapia, che ne hanno bisogno in modo continuativo.',
    interval: 'Ogni 30 giorni (max 4 volte/anno)',
    duration: '60–90 min',
  },
  {
    code: 'BC',
    name: 'Bicomponente',
    icon: Layers,
    gradient: 'from-violet-500 to-purple-700',
    lightBg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    tip: 'Sapevi che la donazione bicomponente permette di raccogliere due emocomponenti diversi — come globuli rossi e plasma — in una sola seduta? Grazie all\'aferesi, i componenti non necessari vengono reinfusi al donatore durante il prelievo, massimizzando l\'utilità di ogni donazione.',
    interval: 'Ogni 90 giorni',
    duration: '60–90 min',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Registrati',
    description: 'Crea il tuo account in meno di 2 minuti. Completa il profilo sanitario con i tuoi dati e il gruppo sanguigno.',
    icon: UserCheck,
  },
  {
    step: '02',
    title: 'Prenota',
    description: 'Scegli il tipo di donazione, il centro più vicino e lo slot orario che preferisci. Il sistema verifica automaticamente la tua idoneità.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Dona',
    description: 'Presentati al centro alla data prenotata. Il personale medico ti accoglie e gestisce tutto il processo in modo digitale.',
    icon: Heart,
  },
  {
    step: '04',
    title: 'Monitora',
    description: 'Ricevi il referto del medico direttamente nell\'app e tieni traccia del tuo storico donazioni in qualsiasi momento.',
    icon: BarChart3,
  },
]

// ── Componenti interni ────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/b-link.svg" alt="B-Link" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight">B-Link</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {[['perche', 'Perché B-Link'], ['tipologie', 'Tipologie'], ['come-funziona', 'Come funziona']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Accedi</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/register">Registrati gratis</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function DonationCards() {
  const [active, setActive] = useState(0)

  return (
    <div className="flex gap-3" style={{ height: '460px' }}>
      {DONATION_TYPES.map((type, i) => {
        const isActive = active === i
        const Icon = type.icon

        return (
          <div
            key={type.code}
            onMouseEnter={() => setActive(i)}
            className="relative rounded-2xl overflow-hidden cursor-pointer"
            style={{
              flex: isActive ? 3 : 1,
              transition: 'flex 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: 0,
            }}
          >
            {/* Sfondo gradiente */}
            <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient}`} />

            {/* Overlay scuro quando collassata */}
            <div
              className="absolute inset-0 bg-black"
              style={{
                opacity: isActive ? 0 : 0.45,
                transition: 'opacity 0.7s ease',
              }}
            />

            {/* Icona — al centro se collassata, in alto a sinistra se espansa */}
            <div
              className="absolute"
              style={{
                top: isActive ? '1.5rem' : '50%',
                left: isActive ? '1.5rem' : '50%',
                transform: isActive ? 'none' : 'translate(-50%, -50%)',
                transition: 'top 0.7s cubic-bezier(0.4,0,0.2,1), left 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div className="bg-white/25 rounded-xl p-3">
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Nome verticale — visibile solo quando collassata */}
            <div
              className="absolute bottom-6 left-0 right-0 flex justify-start pl-5"
              style={{
                opacity: isActive ? 0 : 1,
                transition: 'opacity 0.4s ease',
                transitionDelay: isActive ? '0ms' : '200ms',
              }}
            >
              <span
                className="text-white font-black text-base tracking-widest whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {type.name}
              </span>
            </div>

            {/* Contenuto espanso — visibile solo quando attiva */}
            <div
              className="absolute bottom-0 left-0 right-0 p-6"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transitionDelay: isActive ? '250ms' : '0ms',
              }}
            >
              {/* Badge codice */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wide">{type.code}</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{type.name}</h3>

              <div className="flex flex-wrap gap-3 mb-4 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  {type.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarCheck className="h-3 w-3 shrink-0" />
                  {type.interval}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/20">
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" />
                <p className="text-sm leading-relaxed text-white/85">{type.tip}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrated, user } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    if (isAuthenticated && user?.role) {
      router.replace(ROLE_REDIRECT[user.role])
      return
    }

    // Tenta un ripristino silenzioso della sessione dal cookie refreshToken.
    // Se l'utente ha un token valido viene reindirizzato alla dashboard;
    // se il token è scaduto viene fatto il logout per pulire il cookie stantio
    // (che altrimenti blocca la navigazione verso /auth/login).
    refreshClient.post<{ accessToken: string }>('/auth/refresh')
      .then(async ({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken)
        const { data: me } = await refreshClient.get<AuthMeResponse>('/auth/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        })
        useAuthStore.getState().setUser(me)
        router.replace(ROLE_REDIRECT[me.role as keyof typeof ROLE_REDIRECT])
      })
      .catch(async (err) => {
        if (err?.response?.status === 401) {
          try { await refreshClient.post('/auth/logout') } catch { }
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden">
        {/* Sfondo decorativo */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-rose-500/5 blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl scale-110" />
            <Image
              src="/b-link.svg"
              alt="B-Link"
              width={100}
              height={100}
              className="relative rounded-3xl shadow-2xl"
              priority
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="h-3.5 w-3.5 fill-current" />
            Ogni goccia conta. Ogni donazione salva.
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            La piattaforma digitale
            <br />
            <span className="text-primary">per donare sangue</span>
            <br />
            in modo semplice
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            B-Link connette donatori, operatori sanitari e medici in un unico ecosistema digitale.
            Prenota, dona e monitora il tuo percorso di donazione — tutto da un solo posto.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Button size="lg" className="gap-2 px-8 h-12 text-base" asChild>
              <Link href="/auth/register">
                Inizia a donare
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 text-base px-8" asChild>
              <Link href="/auth/login">Hai già un account? Accedi</Link>
            </Button>
          </div>
        </div>

      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-black tracking-tight">{value}</p>
              <p className="text-sm text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PERCHÉ B-LINK ─────────────────────────────────────────────────────── */}
      <section id="perche" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Perché B-Link</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              La gestione delle donazioni
              <br />
              merita il digitale
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              I processi cartacei rallentano i centri trasfusionali, rendono difficile il monitoraggio
              e lasciano i donatori all&apos;oscuro. B-Link nasce per cambiare tutto questo.
            </p>
          </div>

          {/* 3 colonne per ruolo */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Donatore */}
            <div className="relative rounded-2xl border border-border bg-card p-7 flex flex-col gap-4 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Per i donatori</p>
                <h3 className="text-xl font-bold">Dona quando vuoi, come vuoi</h3>
              </div>
              <ul className="flex flex-col gap-2.5 mt-1">
                {FEATURES_DONOR.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-auto" variant="outline" asChild>
                <Link href="/auth/register">Registrati come donatore</Link>
              </Button>
            </div>

            {/* Operatore */}
            <div className="relative rounded-2xl border border-border bg-card p-7 flex flex-col gap-4 hover:shadow-lg transition-shadow ring-2 ring-primary">
              <div className="absolute top-4 right-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                Staff
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Per gli operatori</p>
                <h3 className="text-xl font-bold">Gestisci il centro senza carta</h3>
              </div>
              <ul className="flex flex-col gap-2.5 mt-1">
                {FEATURES_OPERATOR.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Medico */}
            <div className="relative rounded-2xl border border-border bg-card p-7 flex flex-col gap-4 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Per i medici</p>
                <h3 className="text-xl font-bold">Referti digitali, schede complete</h3>
              </div>
              <ul className="flex flex-col gap-2.5 mt-1">
                {FEATURES_DOCTOR.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIPOLOGIE DONAZIONE ───────────────────────────────────────────────── */}
      <section id="tipologie" className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Tipologie di donazione</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Non tutte le donazioni
              <br />
              sono uguali
            </h2>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground">
              Ogni tipologia ha caratteristiche e requisiti diversi. Scopri curiosità e informazioni utili su ciascuna.
            </p>
          </div>

          <DonationCards />

          <p className="text-center text-xs text-muted-foreground mt-8">
            I requisiti di idoneità variano per tipologia e profilo del donatore. B-Link verifica automaticamente la tua idoneità al momento della prenotazione.
          </p>
        </div>
      </section>

      {/* ── COME FUNZIONA ─────────────────────────────────────────────────────── */}
      <section id="come-funziona" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Come funziona</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Donare non è mai stato
              <br />
              così semplice
            </h2>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground">
              Dalla registrazione al referto, B-Link ti guida in ogni passo del tuo percorso di donazione.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {step.replace('0', '')}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GDPR & SICUREZZA ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-border bg-muted/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 mx-auto sm:mx-0">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Privacy e sicurezza al primo posto</h3>
            <p className="text-muted-foreground leading-relaxed">
              B-Link è conforme al <strong>GDPR (Art. 6 e Art. 9)</strong> per la gestione dei dati sanitari.
              I dati clinici sensibili sono cifrati a riposo con <strong>crittografia PGP</strong>.
              Ogni accesso è protetto da <strong>autenticazione a due fattori (2FA)</strong> per il personale sanitario.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              GDPR Compliant
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              2FA obbligatorio
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Dati cifrati
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl scale-110" />
            <Image
              src="/b-link.svg"
              alt="B-Link"
              width={72}
              height={72}
              className="relative rounded-3xl shadow-xl"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Pronto a fare la differenza?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Unisciti a B-Link oggi. Registrarsi è gratuito e richiede meno di 2 minuti.
            La tua prima donazione potrebbe salvare una vita.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="gap-2 px-10 h-12 text-base" asChild>
              <Link href="/auth/register">
                <Heart className="h-4 w-4 fill-current" />
                Registrati ora — è gratis
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 text-base px-8" asChild>
              <Link href="/auth/login">Accedi</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Hai bisogno di assistenza?{' '}
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-foreground transition-colors">
              Contatta il tuo centro di riferimento
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image src="/b-link.svg" alt="B-Link" width={28} height={28} className="rounded-lg" />
            <span className="font-bold">B-Link</span>
            <span className="text-muted-foreground text-sm">— Sistema di gestione donazioni ematiche</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Accedi</Link>
            <Link href="/auth/register" className="hover:text-foreground transition-colors">Registrati</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} B-Link. Project work universitario.
          </p>
        </div>
      </footer>
    </div>
  )
}
