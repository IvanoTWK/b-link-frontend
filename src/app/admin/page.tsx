'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  ArrowRight,
  LockKeyholeOpen,
  Users,
  Droplets,
  HeartPulse,
  CalendarCheck,
  CalendarDays,
} from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { AdminUser, DonationStats, DonorStats, BookingStats } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedUsers {
  items: AdminUser[]
  nextCursor: string | null
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchAllUsers(): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', {
    params: { limit: 100 },
  })
  return data
}

async function fetchRecentUsers(): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', {
    params: { limit: 5 },
  })
  return data
}

async function fetchDonationStats(): Promise<DonationStats> {
  const { data } = await apiClient.get<DonationStats>('/stats/donations')
  return data
}

async function fetchDonorStats(): Promise<DonorStats> {
  const { data } = await apiClient.get<DonorStats>('/stats/donors')
  return data
}

async function fetchBookingStats(): Promise<BookingStats> {
  const { data } = await apiClient.get<BookingStats>('/stats/bookings')
  return data
}

// ── Card contatore ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  isLoading: boolean
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="bg-muted rounded-lg p-3 shrink-0">{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: allUsersData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: fetchAllUsers,
  })

  const { data: recentData, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['admin', 'dashboard', 'recent'],
    queryFn: fetchRecentUsers,
  })

  const { data: donationStats, isLoading: isLoadingDonations } = useQuery({
    queryKey: ['admin', 'stats', 'donations'],
    queryFn: fetchDonationStats,
  })

  const { data: donorStats, isLoading: isLoadingDonors } = useQuery({
    queryKey: ['admin', 'stats', 'donors'],
    queryFn: fetchDonorStats,
  })

  const { data: bookingStats, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['admin', 'stats', 'bookings'],
    queryFn: fetchBookingStats,
  })

  const totalUsers = allUsersData?.items.length ?? 0
  const lockedUsers = allUsersData?.items.filter((u) => u.lockedAt !== null).length ?? 0
  const recentUsers = recentData?.items ?? []

  const completedBookings =
    bookingStats?.byStatus.find((s) => s.status === 'COMPLETED')?.count ?? 0
  const confirmedBookings =
    bookingStats?.byStatus.find((s) => s.status === 'CONFIRMED')?.count ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Panoramica della piattaforma B-Link.
        </p>
      </div>

      {/* Card contatori utenti */}
      <div>
        <h2 className="text-base font-semibold mb-3">Utenti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <StatCard
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            label="Utenti totali"
            value={totalUsers}
            isLoading={isLoadingAll}
          />
          <StatCard
            icon={<LockKeyholeOpen className="h-5 w-5 text-muted-foreground" />}
            label="Account bloccati"
            value={lockedUsers}
            isLoading={isLoadingAll}
          />
        </div>
      </div>

      {/* Card statistiche donazioni e donatori */}
      <div>
        <h2 className="text-base font-semibold mb-3">Attività</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Droplets className="h-5 w-5 text-muted-foreground" />}
            label="Donazioni totali"
            value={donationStats?.total ?? 0}
            isLoading={isLoadingDonations}
          />
          <StatCard
            icon={<HeartPulse className="h-5 w-5 text-muted-foreground" />}
            label="Donatori registrati"
            value={donorStats?.total ?? 0}
            isLoading={isLoadingDonors}
          />
          <StatCard
            icon={<CalendarCheck className="h-5 w-5 text-muted-foreground" />}
            label="Prenotazioni confermate"
            value={confirmedBookings}
            isLoading={isLoadingBookings}
          />
          <StatCard
            icon={<CalendarDays className="h-5 w-5 text-muted-foreground" />}
            label="Prenotazioni completate"
            value={completedBookings}
            isLoading={isLoadingBookings}
          />
        </div>
      </div>

      {/* Ultimi utenti registrati */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Ultimi utenti registrati</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users" className="flex items-center gap-1">
              Gestisci utenti
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoadingRecent ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : recentUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun utente registrato.</p>
        ) : (
          <div className="w-full rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nome
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Stato
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Registrato il
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-5 py-3">
                      <span className="text-sm font-semibold">{user.name}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm">{user.email}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      {user.lockedAt ? (
                        <Badge variant="destructive" className="text-xs">Bloccato</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Attivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), 'd MMM yyyy', { locale: it })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
