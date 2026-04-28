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

async function fetchLastDonation(): Promise<Donation | null> {
  const { data } = await apiClient.get<PaginatedDonations>('/donations', {
    params: { limit: 1 },
  })
  return data.items[0] ?? null
}

export function LastDonationCard() {
  const { data: donation, isLoading } = useQuery({
    queryKey: ['donor', 'donations', 'last'],
    queryFn: fetchLastDonation,
  })

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const dateStr = donation
    ? new Date(donation.donatedAt).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  const description = donation
    ? [donation.donationType?.name, donation.center?.name].filter(Boolean).join(' · ')
    : 'Nessuna donazione registrata'

  return (
    <BentoCard
      name="Ultima donazione"
      className="col-span-1"
      Icon={Droplets}
      description={description}
      href={donation ? '/donors/donations' : '/donors/bookings/new'}
      cta={donation ? 'Vedi storico' : 'Prenota ora'}
      background={
        <div className="flex h-32 items-center justify-center overflow-hidden px-4">
          {dateStr ? (
            <p className="text-center text-3xl font-black text-neutral-100 dark:text-neutral-800 leading-tight select-none">
              {dateStr}
            </p>
          ) : (
            <Droplets className="h-16 w-16 text-neutral-100 dark:text-neutral-800" />
          )}
        </div>
      }
    />
  )
}
