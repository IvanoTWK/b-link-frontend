'use client'

import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Building2, CalendarDays, ChevronRight, Droplets, Info } from 'lucide-react'

import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
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

// ── Stato senza badge ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
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
  columnHelper.accessor((row) => row.slot?.center?.name, {
    id: 'sede',
    header: () => <ColHeader icon={Building2} label="Sede" />,
    cell: (info) => {
      const name = info.row.original.slot?.center?.name
      const city = info.row.original.slot?.center?.city
      if (!name) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{name}</span>
          {city && <span className="text-xs text-muted-foreground">{city}</span>}
        </div>
      )
    },
  }),
  columnHelper.accessor((row) => row.donationType?.name, {
    id: 'tipo',
    header: () => <ColHeader icon={Droplets} label="Tipo" />,
    cell: (info) => (
      <span className="text-sm">{info.getValue() ?? '—'}</span>
    ),
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
          <Link href={`/donors/bookings/${info.row.original.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    ),
  }),
]

// ── Componente ────────────────────────────────────────────────────────────────

interface BookingsTableProps {
  bookings: Booking[]
  emptyHref?: string
  emptyLabel?: string
}

export function BookingsTable({
  bookings,
  emptyHref = '/donors/bookings/new',
  emptyLabel = 'Nuova prenotazione',
}: BookingsTableProps) {
  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
              Nessuna prenotazione trovata. Inizia prenotando la tua prima donazione.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm" className="px-4">
              <Link href={emptyHref}>{emptyLabel}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
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
            <TableRow key={row.id} className="cursor-pointer">
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
  )
}
