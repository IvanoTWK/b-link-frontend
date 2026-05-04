'use client'

import { useState, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser } from '@/lib/types'
import {
  UsersFilters,
  type AdminUsersFilters,
  EMPTY_USERS_FILTERS,
} from '@/components/admin/users/users-filters'
import { UsersTable } from '@/components/admin/users/users-table'
import { CreateStaffUserDialog } from '@/components/admin/users/create-staff-user-dialog'
import { Button } from '@/components/ui/button'

// ── Costanti ──────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedUsers {
  items: AdminUser[]
  nextCursor: string | null
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchUsers(
  filters: AdminUsersFilters,
  cursor: string | null,
): Promise<PaginatedUsers> {
  const params: Record<string, string | number> = { limit: PAGE_LIMIT }
  if (filters.role) params.role = filters.role
  if (filters.emailVerified !== null) params.emailVerified = String(filters.emailVerified)
  if (filters.locked !== null) params.locked = String(filters.locked)
  if (cursor) params.cursor = cursor

  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', { params })
  return data
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUsersFilters>(EMPTY_USERS_FILTERS)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin', 'users', filters],
      queryFn: ({ pageParam }) => fetchUsers(filters, pageParam as string | null),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })

  const handleFiltersChange = useCallback((next: AdminUsersFilters) => {
    setFilters(next)
  }, [])

  const allUsers = data?.pages.flatMap((p) => p.items) ?? []

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
      <UsersTable users={allUsers} isLoading={isLoading} />

      {/* Carica altri */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Caricamento...' : 'Carica altri'}
          </Button>
        </div>
      )}
    </div>
  )
}
