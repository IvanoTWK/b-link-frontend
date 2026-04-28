'use client'

import { Users } from 'lucide-react'

import { useDonorProfile } from '@/hooks/use-donor-profile'
import type { BloodGroup } from '@/lib/types'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
  O_POSITIVE: '0+', O_NEGATIVE: '0-',
  UNKNOWN: '—',
}

const BIOLOGICAL_SEX_LABELS: Record<string, string> = {
  MALE: 'Maschio',
  FEMALE: 'Femmina',
}

export function ProfileCard() {
  const { profile, isLoading } = useDonorProfile()

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  if (!profile) return null

  const bloodLabel =
    profile.bloodGroup && profile.bloodGroup !== 'UNKNOWN'
      ? BLOOD_GROUP_LABELS[profile.bloodGroup as BloodGroup]
      : null
  const sexLabel = BIOLOGICAL_SEX_LABELS[profile.biologicalSex] ?? profile.biologicalSex
  const description = [bloodLabel, sexLabel].filter(Boolean).join(' · ')

  return (
    <BentoCard
      name={`${profile.firstName} ${profile.lastName}`}
      className="col-span-1"
      Icon={Users}
      description={description}
      href="/donors/profile"
      cta="Visualizza profilo"
      background={
        <div className="flex h-32 items-center justify-center overflow-hidden">
          <Users className="h-24 w-24 text-neutral-100 dark:text-neutral-800" />
        </div>
      }
    />
  )
}
