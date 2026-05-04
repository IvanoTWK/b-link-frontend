'use client'

import { useAuthStore } from '@/lib/store/auth.store'
import { BentoGrid } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingsStatsCard } from '@/components/operators/dashboard/bookings-stats-card'
import { DonationsStatsCard } from '@/components/operators/dashboard/donations-stats-card'
import { AwaitingReportCard } from '@/components/operators/dashboard/awaiting-report-card'
import { DonationsByTypeCard } from '@/components/operators/dashboard/donations-by-type-card'
import { SlotOccupancyCard } from '@/components/operators/dashboard/slot-occupancy-card'
import { WeekBookingsCard } from '@/components/operators/dashboard/week-bookings-card'
import { TodayBookingsTable } from '@/components/operators/dashboard/today-bookings-table'

export default function OperatorsPage() {
  const isHydrated = useAuthStore((s) => s.isHydrated)

  return (
    <div className="space-y-6">
      {/* Benvenuto */}
      {!isHydrated ? (
        <Skeleton className="h-8 w-64" />
      ) : (
        <h1 className="text-2xl font-semibold">
          Bentornato!
        </h1>
      )}

      {/* Cards statistiche giornaliere */}
      <BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[18rem]">
        <BookingsStatsCard />
        <DonationsStatsCard />
        <AwaitingReportCard />
      </BentoGrid>

      {/* Cards statistiche avanzate */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-base font-semibold">Statistiche avanzate</h2>
        <BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-[18rem]">
          <DonationsByTypeCard />
          <SlotOccupancyCard />
          <WeekBookingsCard />
        </BentoGrid>
      </div>

      {/* Tabella prenotazioni confermate oggi */}
      <TodayBookingsTable />
    </div>
  )
}
