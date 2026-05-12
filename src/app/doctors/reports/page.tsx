'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { Donation } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { TablePaginator } from '@/components/ui/table-paginator'
import { DoctorPendingReportsTable } from '@/components/doctors/reports/doctor-pending-reports-table'

// ── Tipi ───────────────────────────────────────────────────────────────────────

interface PaginatedDonations {
  items: Donation[]
  nextCursor: string | null
}

// ── Fetch ───────────────────────────────────────────────────────────────────────

async function fetchPendingDonations(): Promise<Donation[]> {
  const { data } = await apiClient.get<PaginatedDonations>('/donations', {
    params: { bookingStatus: 'IN_AWAITING_REPORT', limit: 200 },
  })
  return data.items
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

export default function DoctorReportsPage() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data: allDonations = [], isLoading, isError } = useQuery({
    queryKey: ['doctor', 'donations', 'pending'],
    queryFn: fetchPendingDonations,
  })

  const paged = allDonations.slice(page * pageSize, (page + 1) * pageSize)

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

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <DoctorPendingReportsTable donations={paged as Parameters<typeof DoctorPendingReportsTable>[0]['donations']} />
      )}

      {/* Paginazione */}
      {!isLoading && allDonations.length > 0 && (
        <TablePaginator
          page={page}
          pageSize={pageSize}
          total={allDonations.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
      )}
    </div>
  )
}
