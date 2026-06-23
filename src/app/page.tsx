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
  CalendarCheck,
  Clock,
  ArrowRight,
  Heart,
  Lightbulb,
  UserCheck,
  BarChart3,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth.store'
import { ROLE_REDIRECT } from '@/lib/auth/constants'
import { refreshClient } from '@/lib/api/axios'
import type { AuthMeResponse } from '@/lib/types'
import { LocationsDashboard } from '@/components/dashboard/locations-dashboard'

// ── Dati ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: CalendarCheck,
    title: 'Prenota in pochi clic',
    description: 'Scegli il centro, il tipo di donazione e lo slot che preferisci. Il sistema verifica la tua idoneità in automatico.',
  },
  {
    icon: FileText,
    title: 'Referti sempre con te',
    description: 'Dopo ogni donazione ricevi il referto medico direttamente nell\'app, accessibile in qualsiasi momento.',
  },
  {
    icon: BarChart3,
    title: 'Il tuo storico donazioni',
    description: 'Tieni traccia di ogni donazione effettuata, dei parametri ematici e della tua storia da donatore.',
  },
]

const DONATION_TYPES = [
  {
    code: 'SI',
    name: 'Sangue Intero',
    icon: Droplets,
    gradient: 'from-red-500 to-rose-700',
    interval: 'Ogni 90 gg (uomo) · 180 gg (donna)',
    duration: '30–45 min',
    tip: 'Il tuo organismo rigenera i globuli rossi in poche settimane. Ogni donazione può salvare fino a 3 vite.',
  },
  {
    code: 'PL',
    name: 'Plasma',
    icon: FlaskConical,
    gradient: 'from-amber-400 to-orange-600',
    interval: 'Ogni 14 giorni · max 13 volte/anno',
    duration: '45–60 min',
    tip: 'Il plasma è usato per trattare oltre 50 malattie rare e può essere conservato fino a 2 anni.',
  },
  {
    code: 'PT',
    name: 'Piastrine',
    icon: Microscope,
    gradient: 'from-cyan-400 to-blue-600',
    interval: 'Ogni 30 giorni · max 4 volte/anno',
    duration: '60–90 min',
    tip: 'Le piastrine durano solo 5–7 giorni. Sono essenziali per i pazienti oncologici in chemioterapia.',
  },
  {
    code: 'BC',
    name: 'Bicomponente',
    icon: Layers,
    gradient: 'from-violet-500 to-purple-700',
    interval: 'Ogni 90 giorni',
    duration: '60–90 min',
    tip: 'In un\'unica seduta vengono raccolti due emocomponenti diversi, massimizzando l\'utilità della donazione.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Registrati',
    description: 'Crea il tuo account gratuitamente. Compila il profilo con i tuoi dati e il gruppo sanguigno.',
    icon: UserCheck,
  },
  {
    step: '02',
    title: 'Prenota',
    description: 'Scegli tipologia, centro e orario. La tua idoneità viene verificata automaticamente.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Dona',
    description: 'Presentati al centro alla data prenotata. Il personale medico gestisce tutto il processo.',
    icon: Heart,
  },
  {
    step: '04',
    title: 'Ricevi il referto',
    description: 'Il referto medico è disponibile direttamente nell\'app dopo ogni donazione.',
    icon: FileText,
  },
]

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/b-link.svg" alt="B-Link" width={30} height={30} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight">B-Link</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
          {[
            ['come-funziona', 'Come funziona'],
            ['sedi', 'Sedi'],
            ['donazioni', 'Tipologie'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-sm font-medium" asChild>
            <Link href="/auth/login">Accedi</Link>
          </Button>
          <Button size="sm" className="text-sm font-semibold" asChild>
            <Link href="/auth/register">Registrati</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

// ── Donation accordion cards ──────────────────────────────────────────────────

function DonationCards() {
  const [active, setActive] = useState(0)

  return (
    <>
      {/* ── Mobile: grid verticale ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {DONATION_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <div key={type.code} className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${type.gradient} p-6`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 rounded-xl p-2.5 shrink-0">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wide">
                  {type.code}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{type.name}</h3>
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <Clock className="h-3 w-3 shrink-0" />
                  {type.duration}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <CalendarCheck className="h-3 w-3 shrink-0" />
                  {type.interval}
                </span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/20">
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" />
                <p className="text-sm leading-relaxed text-white/85">{type.tip}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop: accordion ───────────────────────────────────────────────── */}
      <div className="hidden md:flex gap-3" style={{ height: '420px' }}>
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
                transition: 'flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: 0,
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient}`} />
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: isActive ? 0 : 0.4, transition: 'opacity 0.6s ease' }}
              />

              <div
                className="absolute"
                style={{
                  top: isActive ? '1.5rem' : '50%',
                  left: isActive ? '1.5rem' : '50%',
                  transform: isActive ? 'none' : 'translate(-50%, -50%)',
                  transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div className="bg-white/20 rounded-xl p-2.5">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>

              <div
                className="absolute bottom-6 left-0 right-0 flex justify-start pl-4"
                style={{
                  opacity: isActive ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                  transitionDelay: isActive ? '0ms' : '180ms',
                }}
              >
                <span
                  className="text-white font-bold text-sm tracking-widest whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {type.name}
                </span>
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 p-6"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  transitionDelay: isActive ? '200ms' : '0ms',
                }}
              >
                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wide mb-3">
                  {type.code}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{type.name}</h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="flex items-center gap-1.5 text-xs text-white/70">
                    <Clock className="h-3 w-3 shrink-0" />
                    {type.duration}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-white/70">
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
    </>
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
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-6 pt-20 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-12 lg:gap-16">
            {/* Colonna sinistra */}
            <div className="flex flex-col justify-center items-start text-left gap-7">
              <Image
                src="/b-link.svg"
                alt="B-Link"
                width={72}
                height={72}
                className="rounded-2xl shadow-md"
                priority
              />
      
              <div className="flex flex-col items-start gap-4">
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  Dona sangue.
                  <br />
                  <span className="text-primary">Semplice. Digitale.</span>
                </h1>
      
                <p className="max-w-xl text-lg sm:text-xl text-neutral-500 font-normal leading-relaxed">
                  Prenota una donazione, tieni traccia del tuo percorso e ricevi
                  i referti medici, tutto online e in pochi clic.
                </p>
              </div>
      
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-1">
                <Button
                  size="lg"
                  className="gap-2 px-8 h-12 text-base font-semibold"
                  asChild
                >
                  <Link href="/auth/register">
                    Inizia ora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
      
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-medium text-neutral-600"
                  asChild
                >
                  <Link href="/auth/login">Hai già un account?</Link>
                </Button>
              </div>
            </div>
      
            {/* Colonna destra */}
            <div className="flex items-center justify-center">
              <Image
                src="/hero-image.jpg"
                alt="Piattaforma B-Link per la donazione del sangue"
                width={720}
                height={720}
                className="w-full max-w-xl h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFICI ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Tutto quello che ti serve,<br />in un unico posto
            </h2>
            <p className="text-neutral-500 text-lg max-w-xl mx-auto">
              B-Link è la tua area personale per gestire ogni aspetto delle donazioni — dall&apos;appuntamento al referto.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white rounded-2xl border border-neutral-200 p-7 flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 tracking-tight">{title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COME FUNZIONA ─────────────────────────────────────────────────────── */}
      <section id="come-funziona" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Come funziona</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Quattro passi per donare
            </h2>
            <p className="text-neutral-500 text-lg max-w-lg mx-auto">
              Dalla registrazione al referto, B-Link ti guida in ogni fase del tuo percorso.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-4">
                <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-primary/8">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {parseInt(step)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1.5">{title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEDI ─────────────────────────────────────────────────────────────── */}
      <section id="sedi" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <LocationsDashboard />
        </div>
      </section>

      {/* ── TIPOLOGIE ─────────────────────────────────────────────────────────── */}
      <section id="donazioni" className="py-24 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Tipologie di donazione</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Non tutte le donazioni<br />sono uguali
            </h2>
            <p className="text-neutral-500 text-lg max-w-lg mx-auto">
              Ogni tipologia ha tempi e requisiti diversi. Scopri quale fa per te.
            </p>
          </div>

          <DonationCards />

          <p className="text-center text-xs text-neutral-400 mt-8">
            B-Link verifica automaticamente la tua idoneità al momento della prenotazione.
          </p>
        </div>
      </section>

      {/* ── CTA FINALE ────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Pronto a fare la differenza?
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Registrarsi è gratuito e richiede meno di 2 minuti.<br />
            La tua prima donazione potrebbe salvare una vita.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" className="gap-2 px-10 h-12 text-base font-semibold" asChild>
              <Link href="/auth/register">
                <Heart className="h-4 w-4 fill-current" />
                Registrati gratis
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 text-base px-8 font-medium" asChild>
              <Link href="/auth/login">Accedi</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/b-link.svg" alt="B-Link" width={26} height={26} className="rounded-lg" />
            <span className="font-semibold text-sm">B-Link</span>
            <span className="text-neutral-400 text-sm">— Gestione donazioni ematiche</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <Link href="/auth/login" className="hover:text-neutral-700 transition-colors">Accedi</Link>
            <Link href="/auth/register" className="hover:text-neutral-700 transition-colors">Registrati</Link>
          </div>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} B-Link · Project work universitario
          </p>
        </div>
      </footer>
    </div>
  )
}
