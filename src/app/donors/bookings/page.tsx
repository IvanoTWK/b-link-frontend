'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { CalendarDays, ChevronRight, Droplets, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Booking['status'], string> = {
  CONFIRMED: 'Confermata',
  IN_AWAITING_REPORT: 'In attesa referto',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
}

const STATUS_VARIANT: Record<Booking['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  CONFIRMED: 'default',
  IN_AWAITING_REPORT: 'secondary',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBookings(): Promise<PaginatedBookings> {
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: { limit: 20 },
  })
  return data
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['donor', 'bookings'],
    queryFn: fetchBookings,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Le tue prenotazioni</h1>
          <p className="text-sm text-muted-foreground">Storico e prenotazioni attive.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/donors/bookings/new">
            <Plus className="h-4 w-4 mr-1" />
            Nuova prenotazione
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento delle prenotazioni.</p>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Nessuna prenotazione</p>
              <p className="text-sm text-muted-foreground">Prenota la tua prima donazione.</p>
            </div>
            <Button asChild size="sm">
              <Link href="/donors/bookings/new">Prenota ora</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((booking) => (
            <Link key={booking.id} href={`/donors/bookings/${booking.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {booking.donationType?.name ?? '—'}
                      </span>
                      <Badge variant={STATUS_VARIANT[booking.status]}>
                        {STATUS_LABEL[booking.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.slot
                        ? `${formatDate(booking.slot.date)} · ${booking.slot.startTime} · ${booking.slot.center?.name ?? '—'}`
                        : '—'}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
