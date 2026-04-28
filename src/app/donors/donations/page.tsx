'use client'

import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Donation } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { DonationsTable } from '@/components/donors/donations/donations-table'

interface PaginatedDonations {
  items: Donation[]
  nextCursor: string | null
}

async function fetchDonations(): Promise<Donation[]> {
  const { data } = await apiClient.get<PaginatedDonations>('/donations', {
    params: { limit: 50 },
  })
  return data.items
}

export default function DonationsPage() {
  const { data: donations = [], isLoading, isError } = useQuery({
    queryKey: ['donor', 'donations', 'list'],
    queryFn: fetchDonations,
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">
      <div>
        <h1 className="text-xl font-semibold">Le tue donazioni</h1>
        <p className="text-sm text-muted-foreground">Storico delle donazioni effettuate.</p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento delle donazioni.</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DonationsTable donations={donations} />
      )}
    </div>
  )
}
