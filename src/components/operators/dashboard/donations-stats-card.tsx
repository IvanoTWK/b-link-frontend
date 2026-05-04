'use client'

import { Droplets } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Donation } from '@/lib/types'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

interface PaginatedDonations {
  items: Donation[]
  nextCursor: string | null
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

async function fetchTodayDonations(): Promise<Donation[]> {
  const today = getToday()
  const { data } = await apiClient.get<PaginatedDonations>('/donations', {
    params: { dateFrom: today, dateTo: today, limit: 100 },
  })
  return data.items
}

export function DonationsStatsCard() {
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['operator', 'donations', 'today'],
    queryFn: fetchTodayDonations,
  })

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const count = donations.length
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <BentoCard
      name="Donazioni di oggi"
      className="col-span-1"
      Icon={Droplets}
      description={count === 0 ? 'Nessuna donazione registrata oggi' : `${count} donazion${count === 1 ? 'e effettuata' : 'i effettuate'} · ${today}`}
      href="/operators/bookings"
      cta="Visualizza prenotazioni"
      background={
        <div className="flex h-32 flex-col items-center justify-center gap-1 overflow-hidden">
          <p className="text-[4rem] font-black text-chart-2/20 leading-none select-none tabular-nums">
            {count}
          </p>
          <p className="text-sm font-medium text-chart-2/30 select-none">
            donazioni oggi
          </p>
        </div>
      }
    />
  )
}
