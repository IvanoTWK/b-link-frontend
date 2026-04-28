'use client'

import { Calendar, CreditCard, MapPin, Users } from 'lucide-react'
import type { DonorProfile } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'

const BIOLOGICAL_SEX_LABELS: Record<string, string> = {
  MALE: 'Maschio',
  FEMALE: 'Femmina',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

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

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

interface PersonalInfoCardProps {
  profile: DonorProfile
}

export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <CardHeader icon={CreditCard} title="Dati anagrafici" description="Informazioni non modificabili" />
        <div className="divide-y divide-border">
          <InfoRow icon={CreditCard} label="Codice fiscale" value={profile.fiscalCode} />
          <InfoRow icon={Calendar} label="Data di nascita" value={formatDate(profile.dateOfBirth)} />
          <InfoRow icon={MapPin} label="Comune di nascita" value={profile.placeOfBirth} />
          <InfoRow
            icon={Users}
            label="Sesso biologico"
            value={BIOLOGICAL_SEX_LABELS[profile.biologicalSex] ?? profile.biologicalSex}
          />
        </div>
      </CardContent>
    </Card>
  )
}
