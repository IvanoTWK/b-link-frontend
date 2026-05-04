'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserDetailCard } from '@/components/admin/users/user-detail-card'
import { ChangeRoleCard } from '@/components/admin/users/change-role-card'
import { AccountActionsCard } from '@/components/admin/users/account-actions-card'
import { StaffProfileCard } from '@/components/admin/users/staff-profile-card'

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchUser(id: string): Promise<AdminUser> {
  const { data } = await apiClient.get<AdminUser>(`/admin/users/${id}`)
  return data
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => fetchUser(id),
  })

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Utente non trovato.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const isStaffRole = ['OPERATOR', 'DOCTOR', 'ADMIN'].includes(user.role)

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">Dettaglio utente</p>
        </div>
      </div>

      {/* Griglia card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Dati utente — occupa tutta la riga su mobile, colonna sinistra su lg */}
        <div className="lg:col-span-2">
          <UserDetailCard user={user} />
        </div>

        {/* Cambio ruolo */}
        <ChangeRoleCard user={user} />

        {/* Azioni account (solo se ha qualcosa da mostrare) */}
        <AccountActionsCard user={user} />

        {/* Profilo staff (solo se ruolo staff) */}
        {isStaffRole && (
          <div className="lg:col-span-2">
            <StaffProfileCard user={user} />
          </div>
        )}
      </div>
    </div>
  )
}
