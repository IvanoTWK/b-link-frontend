'use client'

import { Droplets, Users } from 'lucide-react'
import type { BloodGroup, DonorProfile } from '@/lib/types'

const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
  O_POSITIVE: '0+', O_NEGATIVE: '0-',
  UNKNOWN: 'Sconosciuto',
}

const BIOLOGICAL_SEX_LABELS: Record<string, string> = {
  MALE: 'Maschio',
  FEMALE: 'Femmina',
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

interface ProfileHeroProps {
  profile: DonorProfile
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  const bloodLabel =
    profile.bloodGroup && profile.bloodGroup !== 'UNKNOWN'
      ? BLOOD_GROUP_LABELS[profile.bloodGroup as BloodGroup]
      : null
  const sexLabel = BIOLOGICAL_SEX_LABELS[profile.biologicalSex] ?? profile.biologicalSex

  return (
    <div className="flex items-center gap-5 px-1 py-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold select-none">
        {getInitials(profile.firstName, profile.lastName)}
      </div>
      <div>
        <h1 className="text-xl font-semibold">
          {profile.firstName} {profile.lastName}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {bloodLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Droplets className="h-3 w-3" />
              {bloodLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <Users className="h-3 w-3" />
            {sexLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
