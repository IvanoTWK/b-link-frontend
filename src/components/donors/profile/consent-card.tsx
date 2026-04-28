'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, LockOpen, Shield } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { DonorProfile } from '@/lib/types'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

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

export function ConsentCard({ profile }: ConsentCardProps) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const handleConsentChange = async (value: boolean) => {
    setSubmitting(true)
    try {
      await apiClient.patch('/donors/profile/consent', { consentPersonalData: value })
      await queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] })
      toast.success('Consenso aggiornato.')
    } catch {
      toast.error('Errore durante l\'aggiornamento del consenso.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
              disabled={submitting}
              onCheckedChange={(checked) => handleConsentChange(checked === true)}
              className="mt-0.5 shrink-0"
            />
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
