'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, CalendarDays, ChevronLeft, Droplets, Download, FileText,
} from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Donation, DonorProfile } from '@/lib/types'
import { generateReportPdf } from '@/lib/utils/generate-report-pdf'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

function RangeIndicator({ value, min, max }: { value: number; min: number; max: number }) {
  const inRange = value >= min && value <= max
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      inRange ? 'text-green-600 dark:text-green-400' : 'text-destructive'
    }`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${inRange ? 'bg-green-500' : 'bg-destructive'}`} />
      {inRange ? 'Nella norma' : 'Fuori norma'}
    </span>
  )
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchDonation(id: string): Promise<Donation> {
  const { data } = await apiClient.get<Donation>(`/donations/${id}`)
  return data
}

async function fetchOwnProfile(): Promise<DonorProfile> {
  const { data } = await apiClient.get<DonorProfile>('/donors/profile')
  return data
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: donation, isLoading, isError } = useQuery({
    queryKey: ['donor', 'donation', id],
    queryFn: () => fetchDonation(id),
  })

  const { data: ownProfile } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: fetchOwnProfile,
  })

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !donation) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Donazione non trovata.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  const donatedAtLabel = new Date(donation.donatedAt).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const reportAvailable = donation.booking?.status === 'COMPLETED'
  const report = donation.medicalReport

  const handleDownloadPdf = () => {
    if (!report?.entries || !ownProfile) return
    generateReportPdf({
      donorFirstName: ownProfile.firstName,
      donorLastName: ownProfile.lastName,
      donorFiscalCode: ownProfile.fiscalCode,
      donorDateOfBirth: ownProfile.dateOfBirth,
      donorBiologicalSex: ownProfile.biologicalSex,
      donationTypeName: donation!.donationType?.name ?? '—',
      donatedAt: donation!.donatedAt,
      centerName: donation!.center?.name,
      centerCity: donation!.center?.city,
      entries: report.entries.map((e) => ({
        parameterName: e.parameterName,
        unit: e.unit,
        measuredValue: e.measuredValue,
        refMin: e.refMin,
        refMax: e.refMax,
      })),
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Dettaglio donazione</h1>
            <p className="text-xs text-muted-foreground font-mono">{donation.id}</p>
          </div>
          {reportAvailable && report && (
            <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={!ownProfile} className="gap-2">
              <Download className="h-4 w-4" />
              Scarica referto
            </Button>
          )}
        </div>

        {/* Tipo + data banner */}
        <div className="flex items-center gap-4 rounded-xl bg-primary/5 border border-primary/20 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Droplets className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">
              {donation.donationType?.name ?? 'Donazione'}
            </p>
            <p className="text-sm text-muted-foreground">{donatedAtLabel}</p>
          </div>
        </div>

        {/* BentoGrid info */}
        <BentoGrid className="grid-cols-2 auto-rows-auto">

          {/* Sede */}
          <BentoCard
            className="col-span-2 lg:col-span-1"
            Icon={Building2}
            name="Sede"
            description={donation.center ? `${donation.center.name} · ${donation.center.city}` : 'Sede non disponibile'}
            background={
              <div className="px-4 pt-4 pb-14 divide-y divide-border">
                {donation.center ? (
                  <>
                    <InfoRow icon={Building2} label="Nome" value={donation.center.name} />
                    <InfoRow icon={CalendarDays} label="Città" value={donation.center.city} />
                  </>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">Informazioni non disponibili</p>
                )}
              </div>
            }
          />

          {/* Data e ora */}
          <BentoCard
            className="col-span-2 lg:col-span-1"
            Icon={CalendarDays}
            name="Data e ora"
            description={donatedAtLabel}
            background={
              <div className="px-4 pt-4 pb-14 divide-y divide-border">
                <InfoRow icon={CalendarDays} label="Data donazione" value={donatedAtLabel} />
                {donation.booking?.slot?.startTime && (
                  <InfoRow
                    icon={CalendarDays}
                    label="Orario slot"
                    value={`${donation.booking.slot.startTime}${donation.booking.slot.endTime ? ` – ${donation.booking.slot.endTime}` : ''}`}
                  />
                )}
                <InfoRow
                  icon={Droplets}
                  label="Tipo donazione"
                  value={donation.donationType?.name ?? '—'}
                />
              </div>
            }
          />

          {/* Referto */}
          <BentoCard
            className="col-span-2"
            Icon={FileText}
            name="Referto medico"
            description={
              reportAvailable && report
                ? `Compilato il ${new Date(report.compiledAt).toLocaleDateString('it-IT')} · ${report.entries.length} parametri`
                : 'In attesa della compilazione del referto da parte del medico.'
            }
            background={
              <div className="px-4 pt-4 pb-14">
                {!reportAvailable ? (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      In attesa di referto
                    </p>
                  </div>
                ) : report ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Parametro</TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valore</TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unità</TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intervallo</TableHead>
                          <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Esito</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="pl-5 py-2.5 text-sm font-medium">{entry.parameterName}</TableCell>
                            <TableCell className="py-2.5 text-sm font-mono tabular-nums">{entry.measuredValue}</TableCell>
                            <TableCell className="py-2.5 text-sm text-muted-foreground">{entry.unit}</TableCell>
                            <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                              {entry.refMin} – {entry.refMax}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <RangeIndicator
                                value={entry.measuredValue}
                                min={entry.refMin}
                                max={entry.refMax}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </div>
            }
          />

        </BentoGrid>
    </div>
  )
}
