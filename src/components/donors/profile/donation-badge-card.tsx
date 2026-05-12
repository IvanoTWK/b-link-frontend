'use client'

import type { DonorProfile } from '@/lib/types'

// ── Livelli badge ─────────────────────────────────────────────────────────────

type BadgeLevel = 'NONE' | 'BRONZO' | 'ARGENTO' | 'ORO' | 'PLATINO'

interface BadgeInfo {
  label: string
  color: string
  bg: string
  border: string
  emoji: string
}

const BADGE_CONFIG: Record<BadgeLevel, BadgeInfo> = {
  NONE:    { label: 'Nessun badge',  color: 'text-muted-foreground', bg: 'bg-muted/40',      border: 'border-border',        emoji: '—'  },
  BRONZO:  { label: 'Bronzo',        color: 'text-amber-700',        bg: 'bg-amber-50',       border: 'border-amber-200',     emoji: '🥉' },
  ARGENTO: { label: 'Argento',       color: 'text-slate-600',        bg: 'bg-slate-50',       border: 'border-slate-200',     emoji: '🥈' },
  ORO:     { label: 'Oro',           color: 'text-yellow-600',       bg: 'bg-yellow-50',      border: 'border-yellow-200',    emoji: '🥇' },
  PLATINO: { label: 'Platino',       color: 'text-sky-600',          bg: 'bg-sky-50',         border: 'border-sky-200',       emoji: '💎' },
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

// ── Componente ────────────────────────────────────────────────────────────────

interface Props {
  profile: DonorProfile
}

export function DonationBadgeCard({ profile }: Props) {
  const { completedDonationsThisYear: donations, maxDonationsPerYear: max } = profile
  const badge = computeBadge(donations ?? 0, max ?? 4)
  const next = nextBadge(badge)
  const cfg = BADGE_CONFIG[badge]

  const donationsForNext = next
    ? Math.ceil(THRESHOLDS.find((t) => t.level === next)!.pct * max)
    : null
  const progressPct = max > 0 ? Math.min((donations / max) * 100, 100) : 0

  const year = new Date().getFullYear()

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} px-5 py-5 flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Badge donatore</p>
          <p className={`text-xl font-bold mt-0.5 ${cfg.color}`}>
            {badge === 'NONE' ? 'Nessun badge' : `${cfg.emoji} ${cfg.label}`}
          </p>
        </div>
        {badge !== 'NONE' && (
          <span className={`text-4xl`}>{cfg.emoji}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{donations ?? 0} donazion{donations === 1 ? 'e' : 'i'} nel {year}</span>
          <span>max {max} / anno</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              badge === 'PLATINO' ? 'bg-sky-400' :
              badge === 'ORO'     ? 'bg-yellow-400' :
              badge === 'ARGENTO' ? 'bg-slate-400' :
              badge === 'BRONZO'  ? 'bg-amber-500' :
              'bg-muted-foreground/30'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Prossimo livello */}
      {next && donationsForNext !== null && (
        <p className="text-xs text-muted-foreground">
          {donationsForNext - (donations ?? 0) > 0
            ? `Ancora ${donationsForNext - (donations ?? 0)} donazion${donationsForNext - (donations ?? 0) === 1 ? 'e' : 'i'} per raggiungere ${BADGE_CONFIG[next].label}`
            : `Prossimo badge: ${BADGE_CONFIG[next].label}`
          }
        </p>
      )}
      {!next && (
        <p className="text-xs text-muted-foreground">Hai raggiunto il livello massimo — grazie per il tuo impegno!</p>
      )}
    </div>
  )
}
