'use client'

import { useState } from 'react'
import { Info, Rows3, Trash2 } from 'lucide-react'

import type { Slot } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { TablePaginator } from '@/components/ui/table-paginator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import {
  OperatorEditSlotDialog,
  type UpdateSlotData,
} from './operator-edit-slot-dialog'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface OperatorSlotsTableProps {
  slots: Slot[]
  isLoading: boolean
  onDelete: (id: string) => void
  isDeleting: boolean
  onUpdate: (id: string, data: UpdateSlotData) => void
  isUpdating: boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorSlotsTable({ slots, isLoading, onDelete, isDeleting, onUpdate, isUpdating }: OperatorSlotsTableProps) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia className="border p-2 bg-muted rounded-sm">
              <Rows3 />
            </EmptyMedia>
            <EmptyTitle className="text-md">Nessuno slot</EmptyTitle>
            <EmptyDescription className="text-sm text-muted-foreground">
              Nessuno slot trovato per i filtri selezionati.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    )
  }

  const paged = slots.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-3">
    <div className="w-full rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Orario
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tipo donazione
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Capacità
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prenotati
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Disponibili
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((slot) => (
            <TableRow key={slot.id}>
              <TableCell className="pl-5 py-3">
                <span className="text-sm font-semibold">
                  {slot.startTime} – {slot.endTime}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm">{slot.donationType?.name ?? '—'}</span>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm">{slot.capacity}</span>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm">{slot.bookedCount}</span>
              </TableCell>
              <TableCell className="py-3">
                <span
                  className={`text-sm font-semibold ${
                    slot.availability === 0
                      ? 'text-destructive'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {slot.availability}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center justify-end gap-1">
                  {slot.bookedCount > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-medium px-2 cursor-default select-none">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            {slot.bookedCount} prenotaz.
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Slot con {slot.bookedCount} prenotazione{slot.bookedCount > 1 ? 'i' : 'e'} attiva{slot.bookedCount > 1 ? '' : ''} — modifica ed eliminazione disabilitate
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <OperatorEditSlotDialog
                    slot={slot}
                    onUpdate={onUpdate}
                    isPending={isUpdating}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={slot.bookedCount > 0 || isDeleting}
                    onClick={() => onDelete(slot.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <TablePaginator
      page={page}
      pageSize={pageSize}
      total={slots.length}
      onPageChange={setPage}
      onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
    />
    </div>
  )
}
