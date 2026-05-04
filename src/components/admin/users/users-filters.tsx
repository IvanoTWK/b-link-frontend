'use client'

import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Tipi ──────────────────────────────────────────────────────────────────────

export interface AdminUsersFilters {
  role: string
  emailVerified: boolean | null
  locked: boolean | null
}

interface UsersFiltersProps {
  filters: AdminUsersFilters
  onChange: (filters: AdminUsersFilters) => void
}

// ── Costanti ──────────────────────────────────────────────────────────────────

export const EMPTY_USERS_FILTERS: AdminUsersFilters = {
  role: '',
  emailVerified: null,
  locked: null,
}

const ROLE_OPTIONS = [
  { value: 'GUEST', label: 'Guest' },
  { value: 'DONOR', label: 'Donatore' },
  { value: 'OPERATOR', label: 'Operatore' },
  { value: 'DOCTOR', label: 'Medico' },
  { value: 'ADMIN', label: 'Admin' },
]

// ── Componente ────────────────────────────────────────────────────────────────

export function UsersFilters({ filters, onChange }: UsersFiltersProps) {
  const setRole = useCallback(
    (value: string) => {
      onChange({ ...filters, role: value === 'all' ? '' : value })
    },
    [filters, onChange],
  )

  const toggleEmailVerified = useCallback(
    (checked: boolean) => {
      onChange({ ...filters, emailVerified: checked ? true : null })
    },
    [filters, onChange],
  )

  const toggleLocked = useCallback(
    (checked: boolean) => {
      onChange({ ...filters, locked: checked ? true : null })
    },
    [filters, onChange],
  )

  return (
    <div className="flex flex-wrap items-end gap-3">

      {/* Ruolo */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Ruolo</Label>
        <Select
          value={filters.role || 'all'}
          onValueChange={setRole}
        >
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tutti i ruoli" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i ruoli</SelectItem>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Email verificata */}
      <div className="flex items-center gap-2 pb-1">
        <Checkbox
          id="emailVerified"
          checked={filters.emailVerified === true}
          onCheckedChange={(checked) => toggleEmailVerified(!!checked)}
        />
        <Label htmlFor="emailVerified" className="text-sm cursor-pointer">
          Solo email verificata
        </Label>
      </div>

      {/* Account bloccato */}
      <div className="flex items-center gap-2 pb-1">
        <Checkbox
          id="locked"
          checked={filters.locked === true}
          onCheckedChange={(checked) => toggleLocked(!!checked)}
        />
        <Label htmlFor="locked" className="text-sm cursor-pointer">
          Solo bloccati
        </Label>
      </div>
    </div>
  )
}
