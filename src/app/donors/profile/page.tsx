'use client'

import { useDonorProfile } from '@/hooks/use-donor-profile'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileHero } from '@/components/donors/profile/profile-hero'
import { PersonalInfoCard } from '@/components/donors/profile/personal-info-card'
import { HealthDataCard } from '@/components/donors/profile/health-data-card'
import { ConsentCard } from '@/components/donors/profile/consent-card'
import { SecurityCard } from '@/components/donors/profile/security-card'

export default function ProfilePage() {
  const { profile, isLoading } = useDonorProfile()

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-4">
      <ProfileHero profile={profile} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PersonalInfoCard profile={profile} />
        <HealthDataCard profile={profile} />
        <ConsentCard profile={profile} />
        <SecurityCard />
      </div>
    </div>
  )
}
