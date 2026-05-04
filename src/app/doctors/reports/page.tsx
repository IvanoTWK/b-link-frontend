'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Donation } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { DoctorPendingReportsTable } from '@/components/doctors/reports/doctor-pending-reports-table'

// ── Costanti ───────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

// ── Tipi ───────────────────────────────────────────────────────────────────────

interface PaginatedDonations {
  items: Donation[]
  nextCursor: string | null
}

// ── Fetch ───────────────────────────────────────────────────────────────────────

async function fetchPendingDonations(cursor: string | null): Promise<PaginatedDonations> {
  const params: Record<string, string | number> = {
    bookingStatus: 'IN_AWAITING_REPORT',
    limit: PAGE_LIMIT,
  }
  if (cursor) params.cursor = cursor

  const { data } = await apiClient.get<PaginatedDonations>('/donations', { params })
  return data
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

export default function DoctorReportsPage() {
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])

  const currentCursor = cursorStack[cursorStack.length - 1]
  const currentPage = cursorStack.length

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctor', 'donations', currentCursor],
    queryFn: () => fetchPendingDonations(currentCursor),
  })

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
        <h1 className="text-xl font-semibold">Referti da compilare</h1>
        <p className="text-sm text-muted-foreground">
          Donazioni del tuo centro in attesa del referto medico.
        </p>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">
          Errore nel caricamento delle donazioni.
        </p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <DoctorPendingReportsTable donations={(data?.items ?? []) as Parameters<typeof DoctorPendingReportsTable>[0]['donations']} />
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
