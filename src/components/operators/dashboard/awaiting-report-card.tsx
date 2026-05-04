'use client'

import { ClipboardList } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

async function fetchAwaitingReport(): Promise<Booking[]> {
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: { status: 'IN_AWAITING_REPORT', limit: 100 },
  })
  return data.items
}

export function AwaitingReportCard() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['operator', 'bookings', 'awaiting-report'],
    queryFn: fetchAwaitingReport,
  })

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const count = bookings.length

  return (
    <BentoCard
      name="In attesa referto"
      className="col-span-1"
      Icon={ClipboardList}
      description={count === 0 ? 'Nessuna donazione in attesa di referto' : `${count} donazion${count === 1 ? 'e in attesa' : 'i in attesa'} di referto medico`}
      href="/operators/bookings"
      cta="Visualizza prenotazioni"
      background={
        <div className="flex h-32 flex-col items-center justify-center gap-1 overflow-hidden">
          <p className={`text-[4rem] font-black leading-none select-none tabular-nums ${
            count > 0 ? 'text-chart-3/30' : 'text-chart-3/15'
          }`}>
            {count}
          </p>
          <p className={`text-sm font-medium select-none ${
            count > 0 ? 'text-chart-3/40' : 'text-chart-3/20'
          }`}>
            {count > 0 ? 'referti da completare' : 'nessun referto pendente'}
          </p>
        </div>
      }
    />
  )
}
