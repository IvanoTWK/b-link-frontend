'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser } from '@/lib/types'
import {
  UsersFilters,
  type AdminUsersFilters,
  EMPTY_USERS_FILTERS,
} from '@/components/admin/users/users-filters'
import { UsersTable } from '@/components/admin/users/users-table'
import { CreateStaffUserDialog } from '@/components/admin/users/create-staff-user-dialog'
import { TablePaginator } from '@/components/ui/table-paginator'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedUsers {
  items: AdminUser[]
  nextCursor: string | null
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchUsers(filters: AdminUsersFilters): Promise<AdminUser[]> {
  const params: Record<string, string | number> = { limit: 100 }
  if (filters.role) params.role = filters.role
  if (filters.emailVerified !== null) params.emailVerified = String(filters.emailVerified)
  if (filters.locked !== null) params.locked = String(filters.locked)

  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', { params })
  return data.items
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUsersFilters>(EMPTY_USERS_FILTERS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data: allUsers = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => fetchUsers(filters),
  })

  const handleFiltersChange = useCallback((next: AdminUsersFilters) => {
    setFilters(next)
    setPage(0)
  }, [])

  const paged = allUsers.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Utenti</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci gli utenti registrati sulla piattaforma.
          </p>
        </div>
        <CreateStaffUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>

      {/* Filtri */}
      <UsersFilters filters={filters} onChange={handleFiltersChange} />

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento degli utenti.</p>
      )}

      {/* Tabella */}
      <UsersTable users={paged} isLoading={isLoading} />

      {/* Paginazione */}
      {!isLoading && allUsers.length > 0 && (
        <TablePaginator
          page={page}
          pageSize={pageSize}
          total={allUsers.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
      )}
    </div>
  )
}
