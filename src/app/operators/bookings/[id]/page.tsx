'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Building,
  CalendarDays,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Droplets,
  FlaskConical,
  Layers,
  Microscope,
  User,
  XCircle,
} from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OperatorBookingActions } from '@/components/operators/bookings/operator-booking-actions'

// ── Costanti ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confermata',
  IN_AWAITING_REPORT: 'In attesa referto',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  CONFIRMED: <CheckCircle2 className="h-6 w-6 text-primary" />,
  IN_AWAITING_REPORT: <ClipboardList className="h-6 w-6 text-amber-500" />,
  COMPLETED: <CheckCircle2 className="h-6 w-6 text-green-500" />,
  CANCELLED: <XCircle className="h-6 w-6 text-destructive" />,
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: 'border-transparent',
  IN_AWAITING_REPORT: 'bg-amber-500/5 border-amber-500/20',
  COMPLETED: 'bg-green-500/5 border-green-500/20',
  CANCELLED: 'bg-destructive/5 border-destructive/20',
}

const CANCELLATION_REASON_LABEL: Record<string, string> = {
  DONOR_CANCELLED: 'Cancellata dal donatore',
  OPERATOR_CANCELLED: "Cancellata dall'operatore",
  NO_SHOW: 'Mancata presentazione',
  FAILED_PRE_CHECK: 'Non idoneo al pre-screening',
}

const TYPE_GRADIENT: Record<string, string> = {
  SI: 'from-red-400 via-rose-500 to-pink-700',
  PL: 'from-yellow-400 via-amber-500 to-orange-600',
  PT: 'from-cyan-400 via-blue-500 to-indigo-700',
  BC: 'from-fuchsia-400 via-violet-600 to-purple-800',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  SI: <Droplets className="h-6 w-6 text-white" />,
  PL: <FlaskConical className="h-6 w-6 text-white" />,
  PT: <Microscope className="h-6 w-6 text-white" />,
  BC: <Layers className="h-6 w-6 text-white" />,
}

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const DAYS_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${DAYS_IT[d.getDay()]} ${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.get<Booking>(`/bookings/${id}`)
  return data
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold">{value ?? '—'}</p>
    </div>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function OperatorBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['operator', 'booking', id],
    queryFn: () => fetchBooking(id),
  })

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Prenotazione non trovata.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  const code = booking.donationType?.code ?? 'SI'
  const gradient = TYPE_GRADIENT[code] ?? TYPE_GRADIENT['SI']
  const icon = TYPE_ICON[code] ?? TYPE_ICON['SI']
  const hasAnamnesis = !!booking.anamnesisForm
  const canAct = booking.status === 'CONFIRMED' || booking.status === 'IN_AWAITING_REPORT'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Dettaglio prenotazione</h1>
        </div>
      </div>

      {/* Banner stato + azioni */}
      <div className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 ${STATUS_BG[booking.status] ?? 'bg-muted/40 border-border'}`}>
        <div className="flex items-center gap-3 min-w-0">
          {STATUS_ICON[booking.status]}
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{STATUS_LABEL[booking.status] ?? booking.status}</p>
            {booking.cancellationReason && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {CANCELLATION_REASON_LABEL[booking.cancellationReason] ?? booking.cancellationReason}
              </p>
            )}
            {booking.status === 'CONFIRMED' && !hasAnamnesis && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Il donatore non ha ancora compilato il questionario anamnestico.
              </p>
            )}
            {booking.status === 'CONFIRMED' && hasAnamnesis && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Questionario compilato il{' '}
                {formatDateShort(booking.anamnesisForm!.compiledAt)}.
              </p>
            )}
          </div>
        </div>
        {canAct && <OperatorBookingActions booking={booking} vertical />}
      </div>

      {/* Grid principale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Banner tipo donazione */}
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 flex flex-col justify-between min-h-[180px]`}>
          <div className="bg-white/20 rounded-xl p-3 w-fit">{icon}</div>
          <div className="flex flex-col gap-1 mt-6">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Tipo donazione</p>
            <p className="text-white text-2xl font-bold leading-tight">
              {booking.donationType?.name ?? '—'}
            </p>
            {booking.donationType && (
              <p className="text-white/70 text-sm mt-1">
                Ogni {booking.donationType.minIntervalDays}gg · min. {booking.donationType.minWeightKg} kg
              </p>
            )}
          </div>
        </div>

        {/* Colonna destra: sede + data + donatore */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 border-border">
            <CardContent className="p-5 flex items-start gap-4 h-full">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Sede di donazione</p>
                <p className="text-sm font-semibold leading-snug">
                  {booking.slot?.center?.name ?? '—'}
                </p>
                {booking.slot?.center && (
                  <p className="text-xs text-muted-foreground">
                    {booking.slot.center.address}, {booking.slot.center.city}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 border-border">
            <CardContent className="p-5 flex items-start gap-4 h-full">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Data e orario</p>
                <p className="text-sm font-semibold capitalize">
                  {booking.slot?.date ? formatDate(booking.slot.date) : '—'}
                </p>
                {booking.slot?.startTime && (
                  <p className="text-xs text-muted-foreground">
                    {booking.slot.startTime}
                    {booking.slot.endTime ? ` – ${booking.slot.endTime}` : ''}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card donatore */}
          <Card className="border-border">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              {booking.donor?.donorProfile ? (
                <div className="flex flex-col gap-2 min-w-0">
                  <p className="text-base font-semibold leading-tight">
                    {booking.donor.donorProfile.firstName} {booking.donor.donorProfile.lastName}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs font-medium">{booking.donor.email ?? '—'}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground">Telefono</p>
                      <p className="text-xs font-medium">{booking.donor.donorProfile.phone ?? '—'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-5 w-40" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Anamnesi */}
      {hasAnamnesis && (
        <Card className="border-border">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Questionario anamnestico</p>
              <span className="text-xs text-muted-foreground">
                · versione {booking.anamnesisForm!.formVersion} · compilato il{' '}
                {formatDateShort(booking.anamnesisForm!.compiledAt)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {booking.anamnesisForm!.answers.map((answer) => (
                <div key={answer.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground font-mono">
                    {answer.questionCode}
                  </span>
                  <span className={`text-xs font-semibold ${answer.answer ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                    {answer.answer ? 'Sì' : 'No'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
