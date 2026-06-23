'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Center } from '@/lib/types'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { LocationsSelector, LocationsSelectorSkeleton } from '@/components/dashboard/locations-list'
import { LocationsMap } from '@/components/dashboard/locations-map'

interface PaginatedCenters {
  items: Center[]
  nextCursor: string | null
}

async function fetchCenters(): Promise<Center[]> {
  const { data } = await apiClient.get<PaginatedCenters>('/centers', {
    params: { limit: 100 },
  })

  return data.items.filter((center) => center.isActive)
}

function hasCoordinates(center: Center) {
  return center.latitude != null && center.longitude != null
}

export function LocationsDashboard() {
  const [selected, setSelected] = useState<Center | null>(null)

  const { data: centers = [], isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'locations'],
    queryFn: fetchCenters,
  })

  const mappedCenters = useMemo(() => centers.filter(hasCoordinates), [centers])
  const selectedCenter = selected && centers.some((center) => center.id === selected.id)
    ? selected
    : centers[0] ?? null
  const selectedMapCenter = selectedCenter && hasCoordinates(selectedCenter)
    ? selectedCenter
    : mappedCenters[0] ?? null

  if (isError) {
    return (
      <Empty className="min-h-104 border border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPin />
          </EmptyMedia>
          <EmptyTitle>Impossibile caricare le sedi</EmptyTitle>
          <EmptyDescription>Riprova tra qualche minuto.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-primary uppercase tracking-widest">Sedi</p>
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Trova una sede B-Link
        </h2>
        <p className="max-w-xl text-lg text-neutral-500">
          Seleziona una sede e consulta la posizione sulla mappa.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          <LocationsSelectorSkeleton />
          <Skeleton className="h-88 rounded-md md:h-96" />
        </div>
      ) : centers.length === 0 ? (
        <Empty className="min-h-104 border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPin />
            </EmptyMedia>
            <EmptyTitle>Nessuna sede disponibile</EmptyTitle>
            <EmptyDescription>Al momento non sono presenti sedi attive.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4">
          <LocationsSelector centers={centers} selected={selectedCenter} onSelect={setSelected} />

          <div className="relative z-0 h-88 overflow-hidden rounded-md border border-border bg-muted md:h-96">
            {mappedCenters.length > 0 ? (
              <LocationsMap centers={mappedCenters} selected={selectedMapCenter} onSelect={setSelected} />
            ) : (
              <Empty className="h-full border-0 bg-background">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>Coordinate non disponibili</EmptyTitle>
                  <EmptyDescription>Le sedi sono presenti, ma non hanno ancora una posizione sulla mappa.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
