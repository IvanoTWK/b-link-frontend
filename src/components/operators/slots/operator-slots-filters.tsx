'use client'

import { useCallback } from 'react'

import type { DonationType } from '@/lib/types'
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

export interface SlotFilters {
  date: string
  donationTypeId: string
}

interface OperatorSlotsFiltersProps {
  filters: SlotFilters
  onChange: (filters: SlotFilters) => void
  donationTypes: DonationType[]
}

// ── Costanti ──────────────────────────────────────────────────────────────────

export const EMPTY_SLOT_FILTERS: SlotFilters = {
  date: '',
  donationTypeId: '',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorSlotsFilters({ filters, onChange, donationTypes }: OperatorSlotsFiltersProps) {
  const set = useCallback(
    (key: keyof SlotFilters, value: string) => {
      onChange({ ...filters, [key]: value })
    },
    [filters, onChange],
  )

  return (
    <div className="flex flex-wrap items-end gap-3">

      {/* Data */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Data</Label>
        <Input
          type="date"
          value={filters.date}
          onChange={(e) => set('date', e.target.value)}
          className="h-9 w-36"
        />
      </div>

      {/* Tipo donazione */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Tipo donazione</Label>
        <Select
          value={filters.donationTypeId || 'all'}
          onValueChange={(v) => set('donationTypeId', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-48">
            <SelectValue placeholder="Tutti i tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            {donationTypes.map((dt) => (
              <SelectItem key={dt.id} value={dt.id}>
                {dt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
