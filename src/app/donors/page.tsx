'use client'

import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import { useDonorProfile } from '@/hooks/use-donor-profile'
import type { Booking } from '@/lib/types'
import { BentoGrid } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingsTable } from '@/components/donors/bookings/bookings-table'
import { ProfileCard } from '@/components/donors/dashboard/profile-card'
import { LastDonationCard } from '@/components/donors/dashboard/last-donation-card'
import { DonationsCountCard } from '@/components/donors/dashboard/donations-count-card'

interface PaginatedBookings {
  items: Booking[]
  nextCursor: string | null
}

async function fetchBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<PaginatedBookings>('/bookings', {
    params: { limit: 20 },
  })
  return data.items
}

export default function DonorsPage() {
  const { profile, isLoading: profileLoading } = useDonorProfile()

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['donor', 'bookings'],
    queryFn: fetchBookings,
  })

  return (
    <div className="space-y-6">
      {/* Benvenuto */}
      {profileLoading ? (
        <Skeleton className="h-8 w-64" />
      ) : (
        <h1 className="text-2xl font-semibold">
          Bentornato, {profile?.firstName}!
        </h1>
      )}

      {/* Cards */}
      <BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[18rem]">
        <ProfileCard />
        <LastDonationCard />
        <DonationsCountCard />
      </BentoGrid>

      {/* Prenotazioni */}
      <div>
        <h2 className="text-base font-semibold mb-3">Le tue prenotazioni</h2>
        {bookingsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <BookingsTable bookings={bookings} />
        )}
      </div>
    </div>
  )
}
