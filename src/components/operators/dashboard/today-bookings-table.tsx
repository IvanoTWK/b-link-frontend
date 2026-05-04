'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 10

const TYPE_BADGE: Record<string, string> = {
  SI: 'bg-red-500/10 text-red-600 dark:text-red-400',
  PL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  PT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  BC: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

async function fetchTodayConfirmed(cursor?: string): Promise<PaginatedBookings> {
  const today = getToday()
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: {
      status: 'CONFIRMED',
      dateFrom: today,
      dateTo: today,
      limit: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    },
  })
  return data
}

export function TodayBookingsTable() {
  const router = useRouter()
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined])
  const currentCursor = cursorStack[cursorStack.length - 1]
  const currentPage = cursorStack.length

  const { data, isLoading } = useQuery({
    queryKey: ['operator', 'bookings', 'today', 'table', currentCursor],
    queryFn: () => fetchTodayConfirmed(currentCursor),
  })

  const items = data?.items ?? []
  const nextCursor = data?.nextCursor ?? null

  function handleNext() {
    if (nextCursor) setCursorStack((prev) => [...prev, nextCursor])
  }

  function handlePrevious() {
    if (currentPage > 1) setCursorStack((prev) => prev.slice(0, -1))
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Prenotazioni confermate oggi</h2>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orario</TableHead>
              <TableHead>Donatore</TableHead>
              <TableHead>Tipo donazione</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground py-10"
                >
                  Nessuna prenotazione confermata per oggi.
                </TableCell>
              </TableRow>
            ) : (
              items.map((booking) => {
                const code = booking.donationType?.code ?? 'SI'
                const donorName = booking.donor?.donorProfile
                  ? `${booking.donor.donorProfile.firstName ?? ''} ${booking.donor.donorProfile.lastName ?? ''}`.trim() || '—'
                  : '—'

                return (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/operators/bookings/${booking.id}`)}
                  >
                    <TableCell className="font-medium tabular-nums">
                      {booking.slot?.startTime ?? '—'}
                      {booking.slot?.endTime ? ` – ${booking.slot.endTime}` : ''}
                    </TableCell>
                    <TableCell>{donorName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[code] ?? TYPE_BADGE['SI']}`}
                      >
                        {booking.donationType?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        currentPage={currentPage}
        hasPrevious={currentPage > 1}
        hasNext={!!nextCursor}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}
