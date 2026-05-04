'use client'

import { CalendarRange } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingStatByStatus {
  status: string
  count: number
}

interface BookingStatsByCancellationReason {
  reason: string | null
  count: number
}

interface BookingStatsResponse {
  total: number
  byStatus: BookingStatByStatus[]
  cancellationsByReason: BookingStatsByCancellationReason[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...
  // Monday as start of week
  const diffToMonday = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    dateFrom: monday.toISOString().split('T')[0],
    dateTo: sunday.toISOString().split('T')[0],
  }
}

async function fetchWeekBookingStats(): Promise<BookingStatsResponse> {
  const { dateFrom, dateTo } = getWeekRange()
  const { data } = await apiClient.get<BookingStatsResponse>('/stats/bookings', {
    params: { dateFrom, dateTo },
  })
  return data
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRMED:          { label: 'Confermate',        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  IN_AWAITING_REPORT: { label: 'Att. referto',      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  COMPLETED:          { label: 'Completate',        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  CANCELLED:          { label: 'Cancellate',        color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
}

const STATUS_ORDER = ['CONFIRMED', 'IN_AWAITING_REPORT', 'COMPLETED', 'CANCELLED']

// ─── Component ────────────────────────────────────────────────────────────────

export function WeekBookingsCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['operator', 'stats', 'bookings', 'this-week'],
    queryFn: fetchWeekBookingStats,
  })

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const total = stats?.total ?? 0

  // Sort by predefined order, then any unknown status
  const sortedStatuses = [
    ...STATUS_ORDER.map((s) => stats?.byStatus.find((r) => r.status === s)).filter(Boolean),
    ...(stats?.byStatus.filter((r) => !STATUS_ORDER.includes(r.status)) ?? []),
  ] as BookingStatByStatus[]

  const { dateFrom, dateTo } = getWeekRange()
  const fromLabel = new Date(dateFrom + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  const toLabel   = new Date(dateTo   + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

  return (
    <BentoCard
      name="Prenotazioni settimana"
      className="col-span-1"
      Icon={CalendarRange}
      description={
        total === 0
          ? `Nessuna prenotazione · ${fromLabel} – ${toLabel}`
          : `${total} prenotazion${total === 1 ? 'e' : 'i'} · ${fromLabel} – ${toLabel}`
      }
      href="/operators/bookings"
      cta="Gestisci prenotazioni"
      background={
        <div className="flex flex-col gap-1.5 px-4 pt-4 pb-2 overflow-hidden">
          {sortedStatuses.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessuna prenotazione questa settimana.</p>
          ) : (
            sortedStatuses.map((row) => {
              const cfg = STATUS_CONFIG[row.status] ?? { label: row.status, color: 'bg-muted text-muted-foreground' }
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
              return (
                <div key={row.status} className="flex items-center gap-2">
                  <span className={`inline-flex min-w-[7rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="tabular-nums text-sm font-semibold w-6 text-right">{row.count}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                  {/* Mini bar */}
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/20"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      }
    />
  )
}
