'use client'

import { useCallback } from 'react'
import { Filter, Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Tipi ──────────────────────────────────────────────────────────────────────

export interface BookingFilters {
  status: string
  dateFrom: string
  dateTo: string
  search: string
}

interface OperatorBookingsFiltersProps {
  filters: BookingFilters
  onChange: (filters: BookingFilters) => void
}

const EMPTY_FILTERS: BookingFilters = {
  status: '',
  dateFrom: '',
  dateTo: '',
  search: '',
}

// ── Helpers data ───────────────────────────────────────────────────────────────

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getToday() {
  return toISO(new Date())
}

function getWeekRange(): { from: string; to: string } {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1 // lun=0
  const from = new Date(now)
  from.setDate(now.getDate() - day)
  const to = new Date(from)
  to.setDate(from.getDate() + 6)
  return { from: toISO(from), to: toISO(to) }
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: toISO(from), to: toISO(to) }
}

function countActive(filters: BookingFilters): number {
  return Object.values(filters).filter((v) => v !== '').length
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorBookingsFilters({ filters, onChange }: OperatorBookingsFiltersProps) {
  const set = useCallback(
    (key: keyof BookingFilters, value: string) => {
      onChange({ ...filters, [key]: value })
    },
    [filters, onChange],
  )

  const setDateRange = useCallback(
    (from: string, to: string) => {
      onChange({ ...filters, dateFrom: from, dateTo: to })
    },
    [filters, onChange],
  )

  const reset = useCallback(() => onChange(EMPTY_FILTERS), [onChange])

  const activeCount = countActive(filters)

  const isToday = filters.dateFrom === getToday() && filters.dateTo === getToday()
  const week = getWeekRange()
  const isThisWeek = filters.dateFrom === week.from && filters.dateTo === week.to
  const month = getMonthRange()
  const isThisMonth = filters.dateFrom === month.from && filters.dateTo === month.to

  return (
    <div className="flex flex-col gap-3">

      {/* Riga principale filtri */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Cerca donatore — primo elemento */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Donatore</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Nome o cognome…"
              className="h-9 w-56 pl-8"
            />
          </div>
        </div>

        {/* Stato */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Stato</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => set('status', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Tutti gli stati" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="CONFIRMED">Confermata</SelectItem>
              <SelectItem value="IN_AWAITING_REPORT">In attesa referto</SelectItem>
              <SelectItem value="COMPLETED">Completata</SelectItem>
              <SelectItem value="CANCELLED">Cancellata</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data da */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Dal</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            className="h-9 w-36"
          />
        </div>

        {/* Data a */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Al</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            className="h-9 w-36"
          />
        </div>

        {/* Badge filtri attivi + reset */}
        <div className="flex items-center gap-2 pb-0.5">
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              {activeCount}
            </Badge>
          )}
          {activeCount > 0 && (
            <Button variant="outline" size="sm" onClick={reset} className="h-7 gap-1.5 text-xs">
              <X className="h-3 w-3" />
              Reimposta
            </Button>
          )}
        </div>
      </div>

      {/* Scorciatoie data */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Rapido:</span>
        <Button
          variant={isToday ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => isToday ? setDateRange('', '') : setDateRange(getToday(), getToday())}
        >
          Oggi
        </Button>
        <Button
          variant={isThisWeek ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => isThisWeek ? setDateRange('', '') : setDateRange(week.from, week.to)}
        >
          Questa settimana
        </Button>
        <Button
          variant={isThisMonth ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => isThisMonth ? setDateRange('', '') : setDateRange(month.from, month.to)}
        >
          Questo mese
        </Button>
      </div>
    </div>
  )
}
