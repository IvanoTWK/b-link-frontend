'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useDonorProfile } from '@/hooks/use-donor-profile'
import { Skeleton } from '@/components/ui/skeleton'

type BadgeLevel = 'NONE' | 'BRONZO' | 'ARGENTO' | 'ORO' | 'PLATINO'

interface BadgeInfo {
  label: string
  emoji: string
  color: string
  bg: string
  border: string
  barColor: string
}

const BADGE_CONFIG: Record<BadgeLevel, BadgeInfo> = {
  NONE:    { label: 'Nessun badge',  emoji: '',   color: 'text-muted-foreground', bg: 'bg-muted/40',   border: 'border-border',     barColor: 'bg-muted-foreground/30' },
  BRONZO:  { label: 'Bronzo',        emoji: '🥉', color: 'text-amber-700',        bg: 'bg-amber-50',   border: 'border-amber-200',  barColor: 'bg-amber-500' },
  ARGENTO: { label: 'Argento',       emoji: '🥈', color: 'text-slate-600',        bg: 'bg-slate-50',   border: 'border-slate-200',  barColor: 'bg-slate-400' },
  ORO:     { label: 'Oro',           emoji: '🥇', color: 'text-yellow-600',       bg: 'bg-yellow-50',  border: 'border-yellow-200', barColor: 'bg-yellow-400' },
  PLATINO: { label: 'Platino',       emoji: '💎', color: 'text-sky-600',          bg: 'bg-sky-50',     border: 'border-sky-200',    barColor: 'bg-sky-400' },
}

const THRESHOLDS: { level: BadgeLevel; pct: number }[] = [
  { level: 'PLATINO', pct: 1.00 },
  { level: 'ORO',     pct: 0.75 },
  { level: 'ARGENTO', pct: 0.50 },
  { level: 'BRONZO',  pct: 0.25 },
]

function computeBadge(donations: number, max: number): BadgeLevel {
  const pct = max > 0 ? donations / max : 0
  for (const t of THRESHOLDS) {
    if (pct >= t.pct) return t.level
  }
  return 'NONE'
}

function nextBadge(current: BadgeLevel): BadgeLevel | null {
  const order: BadgeLevel[] = ['NONE', 'BRONZO', 'ARGENTO', 'ORO', 'PLATINO']
  const idx = order.indexOf(current)
  return idx < order.length - 1 ? order[idx + 1] : null
}

export function BadgeBentoCard() {
  const { profile, isLoading } = useDonorProfile()

  if (isLoading) return <Skeleton className="col-span-1 rounded-xl h-full" />
  if (!profile) return null

  const donations = profile.completedDonationsThisYear ?? 0
  const max = profile.maxDonationsPerYear ?? 4
  const badge = computeBadge(donations, max)
  const next = nextBadge(badge)
  const cfg = BADGE_CONFIG[badge]
  const progressPct = max > 0 ? Math.min((donations / max) * 100, 100) : 0
  const year = new Date().getFullYear()

  const donationsForNext = next
    ? Math.ceil(THRESHOLDS.find((t) => t.level === next)!.pct * max)
    : null
  const remaining = donationsForNext ? donationsForNext - donations : 0

  return (
    <Link
      href="/donors/profile"
      className={`col-span-1 flex flex-col justify-between rounded-xl border ${cfg.border} ${cfg.bg} px-5 py-5 h-full hover:shadow-md transition-shadow`}
    >
      {/* Top */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Badge {year}
          </p>
          {badge === 'NONE' ? (
            <p className="text-lg font-semibold text-muted-foreground">Nessun badge</p>
          ) : (
            <p className={`text-2xl font-bold ${cfg.color}`}>
              {cfg.emoji} {cfg.label}
            </p>
          )}
        </div>
        {badge !== 'NONE' && (
          <span className="text-5xl leading-none">{cfg.emoji}</span>
        )}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{donations} / {max} donazioni</span>
          {next && remaining > 0 && (
            <span>ancora {remaining} per {BADGE_CONFIG[next].label}</span>
          )}
          {!next && (
            <span>livello massimo raggiunto</span>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${cfg.barColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
        Visualizza profilo
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  )
}
