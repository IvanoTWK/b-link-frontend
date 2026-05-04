'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { DonorProfile } from '@/lib/types'
import { useDebounce } from '@/hooks/use-debounce'
import {
  OperatorDonorsFilters,
  type DonorFilters,
  EMPTY_DONOR_FILTERS,
} from '@/components/operators/donors/operator-donors-filters'
import { OperatorDonorsTable } from '@/components/operators/donors/operator-donors-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

// ── Costanti ───────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedDonors {
  items: DonorProfile[]
  nextCursor: string | null
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchDonors(
  filters: DonorFilters,
  debouncedSearch: string,
  cursor: string | null,
): Promise<PaginatedDonors> {
  const params: Record<string, string | number> = { limit: PAGE_LIMIT }
  if (debouncedSearch) params.search = debouncedSearch
  if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup
  if (filters.biologicalSex) params.biologicalSex = filters.biologicalSex
  if (cursor) params.cursor = cursor
  const { data } = await apiClient.get<PaginatedDonors>('/donors', { params })
  return data
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function OperatorDonorsPage() {
  const [filters, setFilters] = useState<DonorFilters>(EMPTY_DONOR_FILTERS)
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])

  const debouncedSearch = useDebounce(filters.search, 400)

  const currentCursor = cursorStack[cursorStack.length - 1]
  const currentPage = cursorStack.length

  // Quando la ricerca debounced cambia, torna alla prima pagina
  const queryFilters = { bloodGroup: filters.bloodGroup, biologicalSex: filters.biologicalSex, search: debouncedSearch }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['operator', 'donors', queryFilters, currentCursor],
    queryFn: () => fetchDonors(filters, debouncedSearch, currentCursor),
  })

  const handleFiltersChange = useCallback((next: DonorFilters) => {
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
        <h1 className="text-xl font-semibold">Donatori</h1>
        <p className="text-sm text-muted-foreground">
          Consulta i profili dei donatori registrati.
        </p>
      </div>

      {/* Filtri */}
      <OperatorDonorsFilters filters={filters} onChange={handleFiltersChange} />

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento dei donatori.</p>
      )}

      {/* Tabella */}
      <OperatorDonorsTable
        donors={data?.items ?? []}
        isLoading={isLoading}
      />

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
