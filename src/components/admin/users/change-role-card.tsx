'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface ChangeRoleCardProps {
  user: AdminUser
}

// ── Costanti ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'GUEST', label: 'Guest' },
  { value: 'DONOR', label: 'Donatore' },
  { value: 'OPERATOR', label: 'Operatore' },
  { value: 'DOCTOR', label: 'Medico' },
  { value: 'ADMIN', label: 'Admin' },
]

// ── Componente ────────────────────────────────────────────────────────────────

export function ChangeRoleCard({ user }: ChangeRoleCardProps) {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [isPending, setIsPending] = useState(false)

  const isDirty = selectedRole !== user.role

  const handleSave = async () => {
    setIsPending(true)
    try {
      await apiClient.patch(`/admin/users/${user.id}/role`, { role: selectedRole })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'user', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Ruolo aggiornato.')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        toast.error('Impossibile declassare l\'unico amministratore.')
      } else {
        const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        toast.error(message ?? 'Errore durante il salvataggio.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Cambia ruolo</p>
            <p className="text-xs text-muted-foreground">Modifica il ruolo assegnato all&apos;utente</p>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <p className="text-xs text-muted-foreground">Ruolo</p>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={!isDirty || isPending} onClick={handleSave}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Salvataggio...
              </>
            ) : (
              'Salva'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
