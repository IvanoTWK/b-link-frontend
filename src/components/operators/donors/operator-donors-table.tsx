'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'

import type { DonorProfile } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { TablePaginator } from '@/components/ui/table-paginator'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface OperatorDonorsTableProps {
  donors: DonorProfile[]
  isLoading: boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorDonorsTable({ donors, isLoading }: OperatorDonorsTableProps) {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!donors.length) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia className="border p-2 bg-muted rounded-sm">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="text-md">Nessun donatore</EmptyTitle>
            <EmptyDescription className="text-sm text-muted-foreground">
              Nessun donatore trovato per i filtri selezionati.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    )
  }

  const paged = donors.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nominativo
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Telefono
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((donor) => (
              <TableRow
                key={donor.id}
                className="cursor-pointer"
                onClick={() => router.push(`/operators/donors/${donor.id}`)}
              >
                <TableCell className="pl-5 py-3">
                  <span className="text-sm font-semibold">
                    {donor.firstName} {donor.lastName}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground">{donor.email ?? '—'}</span>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm">{donor.phone ?? '—'}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePaginator
        page={page}
        pageSize={pageSize}
        total={donors.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
      />
    </div>
  )
}
