'use client'

import { LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import { BentoCard } from '@/components/ui/bento-grid'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotOccupancyStat {
  center: { id: string; name: string; city: string } | undefined
  slotCount: number
  totalCapacity: number
  totalBooked: number
  occupancyRate: number
}

interface StaffProfile {
  center: { id: string; name: string; city: string; address: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

async function fetchCenterId(): Promise<string | null> {
  const { data } = await apiClient.get<StaffProfile>('/staff/profile')
  return data.center?.id ?? null
}

async function fetchSlotOccupancy(centerId: string | null): Promise<SlotOccupancyStat[]> {
  const today = getToday()
  const params: Record<string, string> = { dateFrom: today, dateTo: today }
  if (centerId) params.centerId = centerId
  const { data } = await apiClient.get<SlotOccupancyStat[]>('/stats/slots', { params })
  return data
}

function occupancyColor(rate: number): string {
  if (rate >= 90) return 'text-red-600 dark:text-red-400'
  if (rate >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function progressColor(rate: number): string {
  if (rate >= 90) return '[&_[data-slot=progress-indicator]]:bg-red-500'
  if (rate >= 60) return '[&_[data-slot=progress-indicator]]:bg-amber-500'
  return '[&_[data-slot=progress-indicator]]:bg-emerald-500'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlotOccupancyCard() {
  const { data: centerId, isLoading: isLoadingCenter } = useQuery({
    queryKey: ['operator', 'staff-profile', 'centerId'],
    queryFn: fetchCenterId,
    staleTime: Infinity,
  })

  const { data: stats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['operator', 'stats', 'slots', 'today', centerId],
    queryFn: () => fetchSlotOccupancy(centerId ?? null),
    enabled: centerId !== undefined,
  })

  const isLoading = isLoadingCenter || isLoadingStats

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const totalCapacity = stats.reduce((s, r) => s + r.totalCapacity, 0)
  const totalBooked = stats.reduce((s, r) => s + r.totalBooked, 0)
  const globalRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <BentoCard
      name="Occupazione slot"
      className="col-span-1"
      Icon={LayoutGrid}
      description={
        totalCapacity === 0
          ? 'Nessuno slot programmato per oggi'
          : `${totalBooked} / ${totalCapacity} posti occupati · ${today}`
      }
      href="/operators/slots"
      cta="Gestisci slot"
      background={
        <div className="flex flex-col gap-2 px-4 pt-4 pb-2 overflow-hidden">
          {stats.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessuno slot per oggi.</p>
          ) : (
            <>
              {/* Global summary */}
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-muted-foreground">Totale</span>
                <span className={`text-xs font-semibold tabular-nums ${occupancyColor(globalRate)}`}>
                  {globalRate}%
                </span>
              </div>
              <Progress value={globalRate} className={`h-2 ${progressColor(globalRate)}`} />

              {/* Single-center: show available count prominently */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Posti liberi</span>
                <span className="text-xs font-semibold tabular-nums">
                  {totalCapacity - totalBooked}
                </span>
              </div>
            </>
          )}
        </div>
      }
    />
  )
}
