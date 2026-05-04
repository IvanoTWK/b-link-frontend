'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, Plus } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser, StaffProfileAdmin } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface StaffProfileCardProps {
  user: AdminUser
}

// ── Sottocomponente: profilo presente ─────────────────────────────────────────

function ExistingProfileSection({
  userId,
  staffProfile,
}: {
  userId: string
  staffProfile: NonNullable<AdminUser['staffProfile']>
}) {
  const queryClient = useQueryClient()
  const [newCenterId, setNewCenterId] = useState(staffProfile.centerId ?? '')
  const [isPending, setIsPending] = useState(false)

  const handleUpdate = async () => {
    setIsPending(true)
    try {
      await apiClient.patch<StaffProfileAdmin>(`/admin/staff-profiles/${staffProfile.id}`, {
        centerId: newCenterId.trim() || null,
      })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })
      toast.success('Centro aggiornato.')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message ?? 'Errore durante l\'aggiornamento.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">ID Centro assegnato</Label>
        <div className="flex gap-2">
          <Input
            value={newCenterId}
            onChange={(e) => setNewCenterId(e.target.value)}
            placeholder="UUID centro (vuoto per rimuovere)"
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleUpdate}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Salvataggio...
              </>
            ) : (
              'Riassegna'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ID profilo staff: {staffProfile.id}
        </p>
      </div>
    </div>
  )
}

// ── Sottocomponente: profilo assente ──────────────────────────────────────────

function CreateProfileSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const [centerId, setCenterId] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleCreate = async () => {
    setIsPending(true)
    try {
      await apiClient.post<StaffProfileAdmin>('/admin/staff-profiles', {
        userId,
        centerId: centerId.trim() || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] })
      toast.success('Profilo staff creato.')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        toast.error('L\'utente ha già un profilo staff.')
      } else {
        const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        toast.error(message ?? 'Errore durante la creazione.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Questo utente non ha ancora un profilo staff.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">ID Centro (opzionale)</Label>
        <div className="flex gap-2">
          <Input
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            placeholder="UUID centro"
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleCreate}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Creazione...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Crea profilo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principale ──────────────────────────────────────────────────────

export function StaffProfileCard({ user }: StaffProfileCardProps) {
  const staffProfile = user.staffProfile

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Profilo staff</p>
            <p className="text-xs text-muted-foreground">Gestione profilo e sede</p>
          </div>
        </div>

        {staffProfile ? (
          <ExistingProfileSection userId={user.id} staffProfile={staffProfile} />
        ) : (
          <CreateProfileSection userId={user.id} />
        )}
      </CardContent>
    </Card>
  )
}
