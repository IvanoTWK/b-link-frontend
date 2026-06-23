'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Center } from '@/lib/types'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { LocationsList, LocationsListSkeleton, BookLocationButton } from '@/components/dashboard/locations-list'
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
  const selectedCenter = selected && centers.some((center) => center.id === selected.id) ? selected : mappedCenters[0] ?? null

  if (isError) {
    return (
      <Empty className="min-h-[26rem] border border-border">
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Sedi</h1>
          <p className="text-sm text-muted-foreground">
            Consulta le sedi B-Link e scegli quella più comoda per la tua prossima donazione.
          </p>
        </div>
        <BookLocationButton />
      </div>

      {isLoading ? (
        <div className="grid min-h-[34rem] grid-cols-1 gap-4 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
          <LocationsListSkeleton />
          <Skeleton className="min-h-[28rem] rounded-md" />
        </div>
      ) : centers.length === 0 ? (
        <Empty className="min-h-[26rem] border border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPin />
            </EmptyMedia>
            <EmptyTitle>Nessuna sede disponibile</EmptyTitle>
            <EmptyDescription>Al momento non sono presenti sedi attive.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid min-h-[34rem] grid-cols-1 gap-4 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
          <LocationsList centers={centers} selected={selectedCenter} onSelect={setSelected} />

          <div className="min-h-[28rem] overflow-hidden rounded-md border border-border bg-muted">
            {mappedCenters.length > 0 ? (
              <LocationsMap centers={mappedCenters} selected={selectedCenter} onSelect={setSelected} />
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
