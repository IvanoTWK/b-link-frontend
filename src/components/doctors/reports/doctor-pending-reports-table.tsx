'use client'

import Link from 'next/link'
import { ChevronRight, ClipboardList } from 'lucide-react'

import type { Donation } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Tipi ───────────────────────────────────────────────────────────────────────

interface DonationWithBooking extends Donation {
  booking?: {
    id?: string
    status?: string
    slot?: {
      date?: string
      startTime?: string
    }
  }
}

interface DoctorPendingReportsTableProps {
  donations: DonationWithBooking[]
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function DoctorPendingReportsTable({ donations }: DoctorPendingReportsTableProps) {
  if (donations.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Nessuna donazione in attesa di referto.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Le donazioni registrate dagli operatori appariranno qui.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {donations.map((donation) => (
        <Link
          key={donation.id}
          href={`/doctors/reports/${donation.id}`}
          className="block"
        >
          <Card className="border-border transition-colors hover:bg-muted/40 cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* Icona tipo donazione */}
                <div className="bg-amber-500/10 rounded-lg p-2.5 shrink-0">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {donation.donationType?.name ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {donation.center?.name ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Donata il {formatDate(donation.donatedAt)} alle{' '}
                    {formatTime(donation.donatedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    ID: {donation.id}
                  </p>
                </div>
              </div>

              {/* Badge + chevron */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Attesa referto
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
