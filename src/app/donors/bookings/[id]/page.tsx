'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2, ChevronLeft, ClipboardList, XCircle,
} from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingInfoGrid } from '@/components/donors/bookings/booking-info-grid'
import { BookingActions } from '@/components/donors/bookings/booking-actions'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confermata',
  IN_AWAITING_REPORT: 'In attesa referto',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  CONFIRMED: <CheckCircle2 className="h-6 w-6 text-primary" />,
  IN_AWAITING_REPORT: <ClipboardList className="h-6 w-6 text-muted-foreground" />,
  COMPLETED: <CheckCircle2 className="h-6 w-6 text-green-500" />,
  CANCELLED: <XCircle className="h-6 w-6 text-destructive" />,
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: 'border-transparent',
  IN_AWAITING_REPORT: 'bg-muted/40 border-border',
  COMPLETED: 'bg-green-500/5 border-green-500/20',
  CANCELLED: 'bg-destructive/5 border-destructive/20',
}

const CANCELLATION_REASON_LABEL: Record<string, string> = {
  DONOR_CANCELLED: 'Cancellata dal donatore',
  OPERATOR_CANCELLED: "Cancellata dall'operatore",
  NO_SHOW: 'Mancata presentazione',
  FAILED_PRE_CHECK: 'Non idoneo al pre-screening',
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.get<Booking>(`/bookings/${id}`)
  return data
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['donor', 'booking', id],
    queryFn: () => fetchBooking(id),
  })

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
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

  const canCancel = booking.status === 'CONFIRMED'
  const hasAnamnesis = !!booking.anamnesisForm

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
          <p className="text-xs text-muted-foreground font-mono">{booking.id}</p>
        </div>
      </div>

      {/* Stato banner */}
      <div className={`flex items-center gap-4 rounded-xl border px-5 py-5 ${STATUS_BG[booking.status] ?? 'bg-muted/40 border-border'}`}>
        {STATUS_ICON[booking.status]}
        <div>
          <p className="text-lg font-semibold">{STATUS_LABEL[booking.status] ?? booking.status}</p>
          {booking.cancellationReason && (
            <p className="text-sm text-muted-foreground">
              {CANCELLATION_REASON_LABEL[booking.cancellationReason] ?? booking.cancellationReason}
            </p>
          )}
          {booking.status === 'CONFIRMED' && !hasAnamnesis && (
            <p className="text-sm text-muted-foreground">
              Ricorda di compilare il questionario anamnestico prima dell&apos;appuntamento.
            </p>
          )}
          {booking.status === 'CONFIRMED' && hasAnamnesis && (
            <p className="text-sm text-muted-foreground">
              Questionario compilato il{' '}
              {new Date(booking.anamnesisForm!.compiledAt).toLocaleDateString('it-IT')}.
            </p>
          )}
        </div>
      </div>

      {/* Grid info */}
      <BookingInfoGrid booking={booking} />

      {/* Azioni */}
      {canCancel && (
        <BookingActions bookingId={id} hasAnamnesis={hasAnamnesis} />
      )}

    </div>
  )
}
