'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingsTable } from '@/components/donors/bookings/bookings-table'

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

async function fetchBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: { limit: 20 },
  })
  return data.items
}

export default function BookingsPage() {
  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['donor', 'bookings'],
    queryFn: fetchBookings,
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Le tue prenotazioni</h1>
          <p className="text-sm text-muted-foreground">Storico e prenotazioni attive.</p>
        </div>
        {!isLoading && !isError && bookings.length > 0 && (
          <Button asChild size="sm">
            <Link href="/donors/bookings/new">Nuova prenotazione</Link>
          </Button>
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento delle prenotazioni.</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <BookingsTable bookings={bookings} />
      )}
    </div>
  )
}
