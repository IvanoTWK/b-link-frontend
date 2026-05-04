'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { LockOpen, ShieldOff } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface AccountActionsCardProps {
  user: AdminUser
}

const STAFF_ROLES = ['OPERATOR', 'DOCTOR', 'ADMIN']

// ── Componente ────────────────────────────────────────────────────────────────

export function AccountActionsCard({ user }: AccountActionsCardProps) {
  const queryClient = useQueryClient()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isResetting2fa, setIsResetting2fa] = useState(false)

  const isStaff = STAFF_ROLES.includes(user.role)
  const showUnlock = user.lockedAt !== null
  const showReset2fa = user.twoFactorEnabled && isStaff

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'user', user.id] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  }

  const handleUnlock = async () => {
    setIsUnlocking(true)
    try {
      await apiClient.post(`/admin/users/${user.id}/unlock`)
      await invalidate()
      toast.success('Account sbloccato.')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message ?? 'Errore durante lo sblocco.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleReset2fa = async () => {
    setIsResetting2fa(true)
    try {
      await apiClient.post(`/admin/users/${user.id}/reset-2fa`)
      await invalidate()
      toast.success('2FA reimpostato. Al prossimo login verrà richiesto un nuovo setup.')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 400) {
        toast.error('L\'utente non è staff o il 2FA non è attivo.')
      } else {
        const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        toast.error(message ?? 'Errore durante il reset del 2FA.')
      }
    } finally {
      setIsResetting2fa(false)
    }
  }

  if (!showUnlock && !showReset2fa) return null

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Azioni account</p>
            <p className="text-xs text-muted-foreground">Operazioni di gestione account</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {showUnlock && (
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Sblocca account</p>
                <p className="text-xs text-muted-foreground">
                  L&apos;account risulta bloccato per tentativi di accesso falliti.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isUnlocking}
                onClick={handleUnlock}
              >
                {isUnlocking ? (
                  <>
                    <Spinner className="mr-2" />
                    Sblocco...
                  </>
                ) : (
                  <>
                    <LockOpen className="h-4 w-4 mr-1" />
                    Sblocca
                  </>
                )}
              </Button>
            </div>
          )}

          {showReset2fa && (
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Reset 2FA</p>
                <p className="text-xs text-muted-foreground">
                  Rimuove il segreto TOTP. Al prossimo login verrà richiesto un nuovo setup.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isResetting2fa}
                onClick={handleReset2fa}
              >
                {isResetting2fa ? (
                  <>
                    <Spinner className="mr-2" />
                    Reset...
                  </>
                ) : (
                  'Reset 2FA'
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
