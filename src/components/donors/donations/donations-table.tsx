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
import { Building2, CalendarDays, ChevronRight, Droplets, FileText } from 'lucide-react'

import type { Donation } from '@/lib/types'
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

// ── Stato referto ─────────────────────────────────────────────────────────────

const REPORT_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  IN_AWAITING_REPORT: {
    label: 'In attesa',
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  COMPLETED: {
    label: 'Disponibile',
    dot: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
  },
}

function ReportStatusCell({ available }: { available: boolean }) {
  const s = available ? REPORT_STATUS.COMPLETED : REPORT_STATUS.IN_AWAITING_REPORT
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
      <span className={`text-sm font-medium ${s.text}`}>{s.label}</span>
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

const columnHelper = createColumnHelper<Donation>()

const columns = [
  columnHelper.accessor('donatedAt', {
    id: 'data',
    header: () => <ColHeader icon={CalendarDays} label="Data" />,
    cell: (info) => {
      const time = info.row.original.booking?.slot?.startTime
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">
            {new Date(info.getValue()).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {time && <span className="text-xs text-muted-foreground">{time}</span>}
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
  columnHelper.accessor((row) => row.center?.name, {
    id: 'sede',
    header: () => <ColHeader icon={Building2} label="Sede" />,
    cell: (info) => {
      const name = info.row.original.center?.name
      const city = info.row.original.center?.city
      if (!name) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{name}</span>
          {city && <span className="text-xs text-muted-foreground">{city}</span>}
        </div>
      )
    },
  }),
  columnHelper.accessor((row) => row.booking?.status === 'COMPLETED', {
    id: 'referto',
    header: () => <ColHeader icon={FileText} label="Referto" />,
    cell: (info) => <ReportStatusCell available={info.getValue()} />,
  }),
  columnHelper.display({
    id: 'azioni',
    header: '',
    cell: (info) => (
      <div className="flex justify-end">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/donors/donations/${info.row.original.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    ),
  }),
]

// ── Componente ────────────────────────────────────────────────────────────────

interface DonationsTableProps {
  donations: Donation[]
}

export function DonationsTable({ donations }: DonationsTableProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data: donations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
  })

  if (donations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia className="border p-2 bg-muted rounded-sm">
              <Droplets />
            </EmptyMedia>
            <EmptyTitle className="text-md">Nessuna donazione</EmptyTitle>
            <EmptyDescription className="text-sm text-muted-foreground">
              Non hai ancora effettuato donazioni. Prenota la tua prima donazione.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm" className="px-4">
              <Link href="/donors/bookings/new">Prenota ora</Link>
            </Button>
          </EmptyContent>
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

      <TablePaginator
        page={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        total={donations.length}
        onPageChange={(p) => table.setPageIndex(p)}
        onPageSizeChange={(s) => { table.setPageSize(s); table.setPageIndex(0) }}
      />
    </div>
  )
}
