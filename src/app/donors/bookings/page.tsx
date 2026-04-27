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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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
    <div className="flex flex-col min-h-[calc(100dvh-6.5rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Le tue prenotazioni</h1>
          <p className="text-sm text-muted-foreground">Storico e prenotazioni attive.</p>
        </div>
        {!isLoading && !isError && data && data.items.length > 0 && (
          <Button asChild size="sm">
            <Link href="/donors/bookings/new">
              Nuova prenotazione
            </Link>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive mt-4">Errore nel caricamento delle prenotazioni.</p>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia className="border p-2 bg-muted rounded-sm">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle className="text-md">Non hai nessuna prenotazione</EmptyTitle>
              <EmptyDescription className="text-sm text-muted-foreground">
                Nessuna prenotazione in programma. Inizia prenotando la tua prima donazione.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="sm" className="px-4">
                <Link href="/donors/bookings/new">
                  Nuova prenotazione
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-3 mt-4">
          {data.items.map((booking) => (
            <Link key={booking.id} href={`/donors/bookings/${booking.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {booking.donationType?.name ?? '—'}
                      </span>
                      <Badge variant={STATUS_VARIANT[booking.status]}>
                        {STATUS_LABEL[booking.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
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
