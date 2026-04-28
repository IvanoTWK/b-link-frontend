'use client'

import { Heart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Donation } from '@/lib/types'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

interface PaginatedDonations {
  items: Donation[]
  nextCursor: string | null
}

async function fetchDonations(): Promise<PaginatedDonations> {
  const { data } = await apiClient.get<PaginatedDonations>('/donations', {
    params: { limit: 100 },
  })
  return data
}

export function DonationsCountCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['donor', 'donations'],
    queryFn: fetchDonations,
  })

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const count = data?.items.length ?? 0
  const hasMore = !!data?.nextCursor

  return (
    <BentoCard
      name="Donazioni effettuate"
      className="col-span-1"
      Icon={Heart}
      description={count > 0 ? `${count}${hasMore ? '+' : ''} donazioni totali` : 'Nessuna donazione effettuata'}
      href={count > 0 ? '/donors/donations' : '/donors/bookings/new'}
      cta={count > 0 ? 'Vedi storico' : 'Prenota ora'}
      background={
        <div className="flex h-32 items-center justify-center overflow-hidden">
          <p className="text-[5rem] font-black text-neutral-100 dark:text-neutral-800 leading-none select-none tabular-nums">
            {count}{hasMore ? '+' : ''}
          </p>
        </div>
      }
    />
  )
}
