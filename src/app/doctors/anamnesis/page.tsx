'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ClipboardList } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface BookingWithAnamnesis {
  id: string
  donorId: string
  status: string
  createdAt: string
  slot: {
    date: string
    startTime: string
    center: { name: string; city: string }
    donationType: { name: string; code: string }
  }
  donor: {
    email?: string | null
    donorProfile?: { firstName: string | null; lastName: string | null } | null
  } | null
  anamnesisForm: {
    id: string
    compiledAt: string
    reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  } | null
}

interface PaginatedBookings {
  items: BookingWithAnamnesis[]
  nextCursor: string | null
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchPendingAnamnesis(): Promise<BookingWithAnamnesis[]> {
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: {
      status: 'CONFIRMED',
      anamnesisReviewStatus: 'PENDING',
      limit: 200,
    },
  })
  return data.items
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

const TYPE_COLOR: Record<string, string> = {
  SI: 'bg-red-500/10 text-red-700 border-red-200',
  PL: 'bg-amber-500/10 text-amber-700 border-amber-200',
  PT: 'bg-blue-500/10 text-blue-700 border-blue-200',
  BC: 'bg-violet-500/10 text-violet-700 border-violet-200',
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

export default function DoctorAnamnesisPage() {
  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['doctor', 'anamnesis', 'pending'],
    queryFn: fetchPendingAnamnesis,
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">
      <div>
        <h1 className="text-xl font-semibold">Questionari da revisionare</h1>
        <p className="text-sm text-muted-foreground">
          Prenotazioni con questionario anamnestico compilato in attesa di revisione medica.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Errore nel caricamento dei questionari.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 py-16">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nessun questionario in attesa di revisione.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((booking) => {
            const donorName =
              booking.donor?.donorProfile
                ? `${booking.donor.donorProfile.firstName ?? ''} ${booking.donor.donorProfile.lastName ?? ''}`.trim()
                : booking.donor?.email ?? '—'
            const code = booking.slot.donationType.code
            const compiledAt = booking.anamnesisForm?.compiledAt

            return (
              <Link
                key={booking.id}
                href={`/doctors/anamnesis/${booking.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{donorName}</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLOR[code] ?? 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {booking.slot.donationType.name}
                    </span>
                    <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                      In attesa
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Appuntamento: {formatDate(booking.slot.date)} ore {formatTime(booking.slot.startTime)}
                    {' · '}{booking.slot.center.name}
                  </p>
                  {compiledAt && (
                    <p className="text-xs text-muted-foreground">
                      Questionario compilato il {formatDate(compiledAt)}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
