'use client'

import { useCallback } from 'react'
import { Search } from 'lucide-react'

import { BLOOD_GROUP_LABEL } from '@/lib/constants/labels'
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

export interface DonorFilters {
  search: string
  bloodGroup: string
  biologicalSex: string
}

interface OperatorDonorsFiltersProps {
  filters: DonorFilters
  onChange: (filters: DonorFilters) => void
}

// ── Costanti ──────────────────────────────────────────────────────────────────

export const EMPTY_DONOR_FILTERS: DonorFilters = {
  search: '',
  bloodGroup: '',
  biologicalSex: '',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorDonorsFilters({ filters, onChange }: OperatorDonorsFiltersProps) {
  const set = useCallback(
    (key: keyof DonorFilters, value: string) => {
      onChange({ ...filters, [key]: value })
    },
    [filters, onChange],
  )

  return (
    <div className="flex flex-wrap items-end gap-3">

      {/* Cerca per nome — primo elemento */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Donatore</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-9 w-56 pl-8"
            placeholder="Es. Rossi, Mario..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>
      </div>

      {/* Gruppo sanguigno */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Gruppo sanguigno</Label>
        <Select
          value={filters.bloodGroup || 'all'}
          onValueChange={(v) => set('bloodGroup', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tutti i gruppi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i gruppi</SelectItem>
            {Object.entries(BLOOD_GROUP_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sesso biologico */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Sesso biologico</Label>
        <Select
          value={filters.biologicalSex || 'all'}
          onValueChange={(v) => set('biologicalSex', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tutti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="MALE">Maschio</SelectItem>
            <SelectItem value="FEMALE">Femmina</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
