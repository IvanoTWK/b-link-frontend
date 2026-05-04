'use client'

import { useQuery } from '@tanstack/react-query'
import { ClipboardList, CheckCircle2 } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchPendingReportsCount(): Promise<number> {
  const { data } = await apiClient.get<{ items: unknown[]; nextCursor: string | null }>('/bookings', {
    params: { status: 'IN_AWAITING_REPORT', limit: 100 },
  })
  return data.items.length
}

async function fetchCompletedTodayCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await apiClient.get<{ items: unknown[]; nextCursor: string | null }>('/medical/reports', {
    params: { dateFrom: today, dateTo: today, limit: 100 },
  })
  return data.items.length
}

export default function DoctorsPage() {
  const { data: pendingCount = 0, isLoading: loadingPending } = useQuery({
    queryKey: ['doctor', 'pending-reports-count'],
    queryFn: fetchPendingReportsCount,
  })

  const { data: completedToday = 0, isLoading: loadingCompleted } = useQuery({
    queryKey: ['doctor', 'completed-today-count'],
    queryFn: fetchCompletedTodayCount,
  })

  const isLoading = loadingPending || loadingCompleted

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bentornato!</h1>

      <BentoGrid className="grid-cols-1 md:grid-cols-2 auto-rows-[18rem]">
        {isLoading ? (
          <>
            <Skeleton className="col-span-1 rounded-xl h-full" />
            <Skeleton className="col-span-1 rounded-xl h-full" />
          </>
        ) : (
          <>
            <BentoCard
              name="Referti in attesa"
              className="col-span-1"
              Icon={ClipboardList}
              description={
                pendingCount === 0
                  ? 'Nessuna donazione in attesa di referto'
                  : `${pendingCount} donazion${pendingCount === 1 ? 'e' : 'i'} in attesa di referto medico`
              }
              href="/doctors/reports"
              cta="Compila referti"
              background={
                <div className="flex h-32 flex-col items-center justify-center gap-1 overflow-hidden">
                  <p className={`text-[4rem] font-black leading-none select-none tabular-nums ${
                    pendingCount > 0 ? 'text-chart-3/30' : 'text-chart-3/15'
                  }`}>
                    {pendingCount}
                  </p>
                  <p className={`text-sm font-medium select-none ${
                    pendingCount > 0 ? 'text-chart-3/40' : 'text-chart-3/20'
                  }`}>
                    {pendingCount > 0 ? 'da completare' : 'nessuno in attesa'}
                  </p>
                </div>
              }
            />

            <BentoCard
              name="Referti compilati oggi"
              className="col-span-1"
              Icon={CheckCircle2}
              description={
                completedToday === 0
                  ? 'Nessun referto compilato oggi'
                  : `${completedToday} refert${completedToday === 1 ? 'o compilato' : 'i compilati'} oggi`
              }
              href="/doctors/reports"
              cta="Visualizza tutti"
              background={
                <div className="flex h-32 flex-col items-center justify-center gap-1 overflow-hidden">
                  <p className={`text-[4rem] font-black leading-none select-none tabular-nums ${
                    completedToday > 0 ? 'text-chart-2/30' : 'text-chart-2/15'
                  }`}>
                    {completedToday}
                  </p>
                  <p className={`text-sm font-medium select-none ${
                    completedToday > 0 ? 'text-chart-2/40' : 'text-chart-2/20'
                  }`}>
                    {completedToday > 0 ? 'oggi' : 'nessuno oggi'}
                  </p>
                </div>
              }
            />
          </>
        )}
      </BentoGrid>
    </div>
  )
}
