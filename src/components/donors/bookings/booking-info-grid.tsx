'use client'

import { Building, CalendarDays, Droplets, FlaskConical, Layers, Microscope } from 'lucide-react'

import type { Booking } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'

// ── Costanti ──────────────────────────────────────────────────────────────────

const TYPE_GRADIENT: Record<string, string> = {
  SI: 'from-red-400 via-rose-500 to-pink-700',
  PL: 'from-yellow-400 via-amber-500 to-orange-600',
  PT: 'from-cyan-400 via-blue-500 to-indigo-700',
  BC: 'from-fuchsia-400 via-violet-600 to-purple-800',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  SI: <Droplets className="h-6 w-6 text-white" />,
  PL: <FlaskConical className="h-6 w-6 text-white" />,
  PT: <Microscope className="h-6 w-6 text-white" />,
  BC: <Layers className="h-6 w-6 text-white" />,
}

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const DAYS_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${DAYS_IT[d.getDay()]} ${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`
}

// ── Componente ────────────────────────────────────────────────────────────────

interface BookingInfoGridProps {
  booking: Booking
}

export function BookingInfoGrid({ booking }: BookingInfoGridProps) {
  const code = booking.donationType?.code ?? 'SI'
  const gradient = TYPE_GRADIENT[code] ?? TYPE_GRADIENT['SI']
  const icon = TYPE_ICON[code] ?? TYPE_ICON['SI']

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Banner tipo donazione */}
      <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 flex flex-col justify-between min-h-[180px]`}>
        <div className="bg-white/20 rounded-xl p-3 w-fit">{icon}</div>
        <div className="flex flex-col gap-1 mt-6">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Tipo donazione</p>
          <p className="text-white text-2xl font-bold leading-tight">
            {booking.donationType?.name ?? '—'}
          </p>
          {booking.donationType && (
            <p className="text-white/70 text-sm mt-1">
              Ogni {booking.donationType.minIntervalDays}gg · min. {booking.donationType.minWeightKg} kg
            </p>
          )}
        </div>
      </div>

      {/* Cards sede + data */}
      <div className="flex flex-col gap-4">

        {/* Sede */}
        <Card className="flex-1 border-border">
          <CardContent className="p-5 flex items-start gap-4 h-full">
            <div className="bg-muted rounded-lg p-2.5 shrink-0">
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground font-medium">Sede di donazione</p>
              <p className="text-sm font-semibold leading-snug">
                {booking.slot?.center?.name ?? '—'}
              </p>
              {booking.slot?.center && (
                <p className="text-xs text-muted-foreground">
                  {booking.slot.center.address}, {booking.slot.center.city}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data e orario */}
        <Card className="flex-1 border-border">
          <CardContent className="p-5 flex items-start gap-4 h-full">
            <div className="bg-muted rounded-lg p-2.5 shrink-0">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground font-medium">Data e orario</p>
              <p className="text-sm font-semibold capitalize">
                {booking.slot?.date ? formatDate(booking.slot.date) : '—'}
              </p>
              {booking.slot?.startTime && (
                <p className="text-xs text-muted-foreground">
                  {booking.slot.startTime}
                  {booking.slot.endTime ? ` – ${booking.slot.endTime}` : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
