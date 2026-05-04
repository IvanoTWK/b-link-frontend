'use client'

import { CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

async function fetchTodayBookings(): Promise<Booking[]> {
  const today = getToday()
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: { dateFrom: today, dateTo: today, status: 'CONFIRMED', limit: 100 },
  })
  return data.items
}

export function BookingsStatsCard() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['operator', 'bookings', 'today', 'confirmed'],
    queryFn: fetchTodayBookings,
  })

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const count = bookings.length
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <BentoCard
      name="Prenotazioni di oggi"
      className="col-span-1"
      Icon={CalendarDays}
      description={count === 0 ? 'Nessuna prenotazione confermata per oggi' : `${count} prenotazion${count === 1 ? 'e confermata' : 'i confermate'} · ${today}`}
      href="/operators/bookings"
      cta="Gestisci prenotazioni"
      background={
        <div className="flex h-32 flex-col items-center justify-center gap-1 overflow-hidden">
          <p className="text-[4rem] font-black text-chart-1/20 leading-none select-none tabular-nums">
            {count}
          </p>
          <p className="text-sm font-medium text-chart-1/30 select-none">
            confermate oggi
          </p>
        </div>
      }
    />
  )
}
