'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { OperatorBookingsTable } from '@/components/operators/bookings/operator-bookings-table'
import {
  OperatorBookingsFilters,
  type BookingFilters,
} from '@/components/operators/bookings/operator-bookings-filters'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

// ── Costanti ───────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchOperatorBookings(
  filters: BookingFilters,
  cursor: string | null,
): Promise<PaginatedBookings> {
  const params: Record<string, string | number> = { limit: PAGE_LIMIT }

  if (filters.status) params.status = filters.status
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.search) params.search = filters.search
  if (cursor) params.cursor = cursor

  const { data } = await apiClient.get<PaginatedBookings>('/bookings', { params })
  return data
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: BookingFilters = {
  status: '',
  dateFrom: '',
  dateTo: '',
  search: '',
}

export default function OperatorBookingsPage() {
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_FILTERS)
  // Stack di cursor: null = pagina 1, ogni elemento è il cursore della pagina successiva
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])

  const currentCursor = cursorStack[cursorStack.length - 1]
  const currentPage = cursorStack.length

  const { data, isLoading, isError } = useQuery({
    queryKey: ['operator', 'bookings', filters, currentCursor],
    queryFn: () => fetchOperatorBookings(filters, currentCursor),
  })

  const handleFiltersChange = useCallback((next: BookingFilters) => {
    setFilters(next)
    setCursorStack([null])
  }, [])

  const handleNext = useCallback(() => {
    if (data?.nextCursor) {
      setCursorStack((prev) => [...prev, data.nextCursor])
    }
  }, [data?.nextCursor])

  const handlePrevious = useCallback(() => {
    setCursorStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const hasPrevious = currentPage > 1
  const hasNext = !!data?.nextCursor

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Prenotazioni</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci le prenotazioni dei donatori della tua sede.
        </p>
      </div>

      {/* Filtri */}
      <OperatorBookingsFilters filters={filters} onChange={handleFiltersChange} />

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">
          Errore nel caricamento delle prenotazioni.
        </p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <OperatorBookingsTable bookings={data?.items ?? []} />
      )}

      {/* Paginazione */}
      {(hasPrevious || hasNext) && (
        <DataTablePagination
          currentPage={currentPage}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  )
}
