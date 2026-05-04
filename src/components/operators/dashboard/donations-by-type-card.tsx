'use client'

import { Droplets, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import { BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DonationTypeBreakdown {
  donationType: { id: string; name: string; code: string } | undefined
  count: number
}

interface DonationStatsResponse {
  total: number
  byCenter: { center: unknown; count: number }[]
  byDonationType: DonationTypeBreakdown[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthRange(monthOffset: 0 | -1): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + monthOffset // 0-indexed
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  return {
    dateFrom: first.toISOString().split('T')[0],
    dateTo: last.toISOString().split('T')[0],
  }
}

async function fetchDonationStats(dateFrom: string, dateTo: string): Promise<DonationStatsResponse> {
  const { data } = await apiClient.get<DonationStatsResponse>('/stats/donations', {
    params: { dateFrom, dateTo },
  })
  return data
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  SI: { bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400',    bar: 'bg-red-500' },
  PL: { bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  PT: { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',  bar: 'bg-blue-500' },
  BC: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
}

const FALLBACK_COLOR = { bg: 'bg-muted', text: 'text-muted-foreground', bar: 'bg-muted-foreground' }

// ─── Component ────────────────────────────────────────────────────────────────

export function DonationsByTypeCard() {
  const currentRange = getMonthRange(0)
  const previousRange = getMonthRange(-1)

  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ['operator', 'stats', 'donations', 'current-month'],
    queryFn: () => fetchDonationStats(currentRange.dateFrom, currentRange.dateTo),
  })

  const { data: previous, isLoading: loadingPrevious } = useQuery({
    queryKey: ['operator', 'stats', 'donations', 'previous-month'],
    queryFn: () => fetchDonationStats(previousRange.dateFrom, previousRange.dateTo),
  })

  const isLoading = loadingCurrent || loadingPrevious

  if (isLoading) {
    return <Skeleton className="col-span-1 rounded-xl h-full" />
  }

  const currentTotal = current?.total ?? 0
  const previousTotal = previous?.total ?? 0

  // Build a lookup from code → count for both months
  const currentByCode: Record<string, number> = {}
  const previousByCode: Record<string, number> = {}

  for (const item of current?.byDonationType ?? []) {
    const code = item.donationType?.code ?? 'OTHER'
    currentByCode[code] = (currentByCode[code] ?? 0) + item.count
  }
  for (const item of previous?.byDonationType ?? []) {
    const code = item.donationType?.code ?? 'OTHER'
    previousByCode[code] = (previousByCode[code] ?? 0) + item.count
  }

  // Merge all known types
  const allCodes = Array.from(
    new Set([
      ...Object.keys(currentByCode),
      ...Object.keys(previousByCode),
    ])
  ).sort()

  const rows = allCodes.map((code) => {
    const curr = currentByCode[code] ?? 0
    const prev = previousByCode[code] ?? 0
    const delta = curr - prev
    const pct = prev > 0 ? Math.round((delta / prev) * 100) : null
    return { code, curr, prev, delta, pct }
  })

  const monthName = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <BentoCard
      name="Donazioni per tipo"
      className="col-span-1"
      Icon={Droplets}
      description={`${currentTotal} donazion${currentTotal === 1 ? 'e' : 'i'} · ${monthName}`}
      href="/operators/bookings"
      cta="Vedi tutte le prenotazioni"
      background={
        <div className="flex flex-col gap-1.5 px-4 pt-4 pb-2 overflow-hidden">
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nessuna donazione questo mese.</p>
          ) : (
            rows.map(({ code, curr, pct, delta }) => {
              const color = TYPE_COLORS[code] ?? FALLBACK_COLOR
              return (
                <div key={code} className="flex items-center gap-2">
                  <span
                    className={`inline-flex min-w-[2.2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}
                  >
                    {code}
                  </span>
                  <span className="tabular-nums text-sm font-medium w-6 text-right">{curr}</span>
                  {pct !== null ? (
                    <span
                      className={`flex items-center gap-0.5 text-xs font-medium ${
                        delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : delta < 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {delta > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : delta < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {Math.abs(pct)}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">nuovo</span>
                  )}
                  {/* Mini bar */}
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden ml-auto">
                    <div
                      className={`h-full rounded-full ${color.bar}`}
                      style={{ width: currentTotal > 0 ? `${Math.round((curr / currentTotal) * 100)}%` : '0%' }}
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
