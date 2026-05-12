'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { CalendarDays, ChevronRight, Droplets, Info, Phone, User } from 'lucide-react'

import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { TablePaginator } from '@/components/ui/table-paginator'
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

// ── Badge tipologia ───────────────────────────────────────────────────────────

const TYPE_GRADIENT: Record<string, string> = {
  SI: 'from-red-400 via-rose-500 to-pink-700',
  PL: 'from-yellow-400 via-amber-500 to-orange-600',
  PT: 'from-cyan-400 via-blue-500 to-indigo-700',
  BC: 'from-fuchsia-400 via-violet-600 to-purple-800',
}

function DonationTypeBadge({ code, name }: { code?: string | null; name?: string | null }) {
  const gradient = code ? (TYPE_GRADIENT[code] ?? null) : null
  if (!name) return <span className="text-sm text-muted-foreground">—</span>
  if (!gradient) return <span className="text-sm">{name}</span>
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white bg-gradient-to-r ${gradient}`}
    >
      {code}
    </span>
  )
}

// ── Stato ─────────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confermata',
  IN_AWAITING_REPORT: 'In attesa referto',
  COMPLETED: 'Completata',
  CANCELLED: 'Cancellata',
}

const STATUS_DOT: Record<string, string> = {
  CONFIRMED: 'bg-blue-500',
  IN_AWAITING_REPORT: 'bg-amber-400',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-destructive',
}

const STATUS_TEXT: Record<string, string> = {
  CONFIRMED: 'text-blue-600 dark:text-blue-400',
  IN_AWAITING_REPORT: 'text-amber-600 dark:text-amber-400',
  COMPLETED: 'text-green-600 dark:text-green-400',
  CANCELLED: 'text-destructive',
}

function StatusCell({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? 'bg-muted-foreground'}`} />
      <span className={`text-sm font-medium ${STATUS_TEXT[status] ?? 'text-foreground'}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    </div>
  )
}

// ── Intestazioni colonne ──────────────────────────────────────────────────────

function ColHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

// ── Colonne ───────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Booking>()

const columns = [
  columnHelper.accessor((row) => row.slot?.date, {
    id: 'data',
    header: () => <ColHeader icon={CalendarDays} label="Data" />,
    cell: (info) => {
      const date = info.row.original.slot?.date
      const time = info.row.original.slot?.startTime
      if (!date) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">
            {new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {time && <span className="text-xs text-muted-foreground">{time}</span>}
        </div>
      )
    },
  }),
  columnHelper.accessor((row) => row.donor?.donorProfile, {
    id: 'donatore',
    header: () => <ColHeader icon={User} label="Donatore" />,
    cell: (info) => {
      const profile = info.getValue()
      if (!profile?.firstName && !profile?.lastName) {
        return <span className="text-sm text-muted-foreground">—</span>
      }
      return (
        <span className="text-sm font-medium">
          {[profile.firstName, profile.lastName].filter(Boolean).join(' ')}
        </span>
      )
    },
  }),
  columnHelper.accessor((row) => row.donor?.donorProfile?.phone, {
    id: 'telefono',
    header: () => <ColHeader icon={Phone} label="Telefono" />,
    cell: (info) => {
      const phone = info.getValue()
      if (!phone) return <span className="text-sm text-muted-foreground">—</span>
      return <span className="text-sm">{phone}</span>
    },
  }),
  columnHelper.accessor((row) => row.donationType, {
    id: 'tipo',
    header: () => <ColHeader icon={Droplets} label="Tipo" />,
    cell: (info) => {
      const dt = info.getValue()
      return <DonationTypeBadge code={dt?.code} name={dt?.name} />
    },
  }),
  columnHelper.accessor('status', {
    header: () => <ColHeader icon={Info} label="Stato" />,
    cell: (info) => <StatusCell status={info.getValue()} />,
  }),
  columnHelper.display({
    id: 'azioni',
    header: '',
    cell: (info) => (
      <div className="flex justify-end">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/operators/bookings/${info.row.original.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    ),
  }),
]

// ── Componente ────────────────────────────────────────────────────────────────

interface OperatorBookingsTableProps {
  bookings: Booking[]
}

export function OperatorBookingsTable({ bookings }: OperatorBookingsTableProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
  })

  if (bookings.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia className="border p-2 bg-muted rounded-sm">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle className="text-md">Nessuna prenotazione</EmptyTitle>
            <EmptyDescription className="text-sm text-muted-foreground">
              Nessuna prenotazione trovata per i filtri selezionati.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header, i) => (
                  <TableHead key={header.id} className={i === 0 ? 'pl-5' : ''}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell key={cell.id} className={i === 0 ? 'pl-5 py-3' : 'py-3'}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePaginator
        page={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        total={bookings.length}
        onPageChange={(p) => table.setPageIndex(p)}
        onPageSizeChange={(s) => { table.setPageSize(s); table.setPageIndex(0) }}
      />
    </div>
  )
}
