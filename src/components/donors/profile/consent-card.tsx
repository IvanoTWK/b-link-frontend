'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, LockOpen, Shield, Clock } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { DonorProfile } from '@/lib/types'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function CardHeader({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="bg-muted rounded-lg p-2.5 shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

interface ConsentCardProps {
  profile: DonorProfile
}

interface GdprRequestItem {
  id: string
  type: string
  status: string
}

export function ConsentCard({ profile }: ConsentCardProps) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [pendingValue, setPendingValue] = useState<boolean | null>(null)

  // Controlla se esiste una richiesta REVOKE_CONSENT in attesa
  const { data: gdprData } = useQuery({
    queryKey: ['donor', 'gdpr-requests'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: GdprRequestItem[] }>('/gdpr/requests')
      return data.items
    },
  })

  const hasPendingRevoke = gdprData?.some(
    (r) => r.type === 'REVOKE_CONSENT' && r.status === 'PENDING'
  ) ?? false

  const handleCheckboxClick = (value: boolean) => {
    setPendingValue(value)
  }

  const handleConfirm = async () => {
    if (pendingValue === null) return
    setSubmitting(true)
    try {
      if (pendingValue) {
        await apiClient.patch('/donors/profile/consent', { consentPersonalData: true })
        toast.success('Consenso aggiornato.')
      } else {
        await apiClient.post('/gdpr/requests', { type: 'REVOKE_CONSENT' })
        toast.success('Richiesta inviata. Il consenso sarà rimosso dopo la conferma dell\'amministratore.')
      }
      await queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] })
      await queryClient.invalidateQueries({ queryKey: ['donor', 'gdpr-requests'] })
    } catch {
      toast.error('Errore durante l\'operazione.')
    } finally {
      setSubmitting(false)
      setPendingValue(null)
    }
  }

  const handleCancel = () => {
    setPendingValue(null)
  }

  return (
    <>
      <Card className="border-border">
        <CardContent className="p-5">
          <CardHeader icon={Shield} title="Privacy e consensi" description="Art. 9 GDPR · Art. 6 GDPR" />
          <div className="space-y-6 mt-6">

            {/* Consenso dati sanitari — non modificabile */}
            <div className="flex items-start gap-3 opacity-60">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                {profile.consentHealthData
                  ? <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug">Trattamento dati sanitari</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Art. 9 GDPR — obbligatorio per le prenotazioni. Non modificabile.
                </p>
              </div>
            </div>

            {/* Consenso comunicazioni — modificabile */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {profile.consentPersonalData
                    ? <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">Comunicazioni sulla donazione</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Art. 6 GDPR — per comunicazioni relative all&apos;attività di donazione.
                  </p>
                </div>
                <Checkbox
                  id="consentPersonalData"
                  checked={profile.consentPersonalData}
                  disabled={submitting || hasPendingRevoke}
                  onCheckedChange={(checked) => handleCheckboxClick(checked === true)}
                  className="mt-0.5 shrink-0"
                />
              </div>

              {/* Messaggio richiesta in attesa */}
              {hasPendingRevoke && (
                <div className="flex items-center gap-1.5 ml-11 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Richiesta di revoca inviata. In attesa di conferma da parte dell&apos;amministratore.</span>
                </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Dialog — aggiunta consenso */}
      <AlertDialog open={pendingValue === true} onOpenChange={(open) => { if (!open) handleCancel() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma consenso</AlertDialogTitle>
            <AlertDialogDescription>
              Autorizzi il trattamento dei tuoi dati personali (nome, cognome, contatti) per le
              comunicazioni relative all&apos;attività di donazione, ai sensi dell&apos;Art. 6 GDPR.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
              Confermo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog — rimozione consenso */}
      <AlertDialog open={pendingValue === false} onOpenChange={(open) => { if (!open) handleCancel() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoca consenso</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  Stai richiedendo la revoca del consenso al trattamento dei tuoi dati personali
                  per le comunicazioni sulla donazione (Art. 6 GDPR).
                </p>
                <p className="font-medium text-foreground">
                  La richiesta sarà presa in carico dall&apos;amministratore. Il consenso resterà
                  attivo fino alla conferma.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Invia richiesta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
