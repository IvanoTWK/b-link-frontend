'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building,
  CalendarDays,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Droplets,
  FlaskConical,
  Layers,
  Microscope,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import type { Donation, DonorProfile } from '@/lib/types'
import { generateReportPdf } from '@/lib/utils/generate-report-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DoctorReportForm, type ExamParameter } from '@/components/doctors/reports/doctor-report-form'

// ── Tipi estesi ────────────────────────────────────────────────────────────────

type DonationWithBooking = Omit<Donation, 'booking'> & {
  booking?: {
    id?: string
    status?: string
    slot?: {
      date?: string
      startTime?: string
    }
  }
}

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

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractApiMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string | string[] } } }).response
    const msg = resp?.data?.message
    if (Array.isArray(msg)) return msg[0]
    return msg
  }
  return undefined
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold">{value ?? '—'}</p>
    </div>
  )
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchDonation(id: string): Promise<DonationWithBooking> {
  const { data } = await apiClient.get<DonationWithBooking>(`/donations/${id}`)
  return data
}

async function fetchDonorProfile(donorId: string): Promise<DonorProfile> {
  const { data } = await apiClient.get<DonorProfile>(`/donors/${donorId}/profile`)
  return data
}

async function fetchExamParameters(): Promise<ExamParameter[]> {
  const { data } = await apiClient.get<ExamParameter[]>('/exam-parameters')
  return data
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

export default function DoctorReportDetailPage() {
  const { donationId } = useParams<{ donationId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: donation, isLoading, isError } = useQuery({
    queryKey: ['doctor', 'donation', donationId],
    queryFn: () => fetchDonation(donationId),
  })

  const { data: donorProfile } = useQuery({
    queryKey: ['doctor', 'donor-profile', donation?.donorId],
    queryFn: () => fetchDonorProfile(donation!.donorId),
    enabled: !!donation?.donorId,
  })

  const { data: examParameters = [], isLoading: loadingParams } = useQuery({
    queryKey: ['doctor', 'exam-parameters'],
    queryFn: fetchExamParameters,
    staleTime: 5 * 60 * 1000, // 5 minuti
  })

  // ── Mutation: crea referto ─────────────────────────────────────────────────

  const { mutate: submitReport, isPending } = useMutation({
    mutationFn: async (entries: Array<{
      parameterName: string
      unit: string
      measuredValue: number
      refMin: number
      refMax: number
    }>) => {
      await apiClient.post('/medical/reports', {
        donationId,
        entries,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'donations'] })
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'pending-reports-count'] })
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'completed-today-count'] })
      toast.success('Referto salvato. Donazione completata.')
      router.push('/doctors/reports')
    },
    onError: (err) => {
      toast.error(extractApiMessage(err) ?? 'Errore durante il salvataggio del referto.')
    },
  })

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const code = donation.donationType?.code ?? 'SI'
  const gradient = TYPE_GRADIENT[code] ?? TYPE_GRADIENT['SI']
  const icon = TYPE_ICON[code] ?? TYPE_ICON['SI']
  const hasReport = !!donation.medicalReport
  const bookingStatus = (donation as DonationWithBooking).booking?.status
  const canCompile = bookingStatus === 'IN_AWAITING_REPORT' && !hasReport

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPdf = () => {
    if (!donation.medicalReport?.entries || !donorProfile) return
    generateReportPdf({
      donorFirstName: donorProfile.firstName,
      donorLastName: donorProfile.lastName,
      donorFiscalCode: donorProfile.fiscalCode,
      donorDateOfBirth: donorProfile.dateOfBirth,
      donorBiologicalSex: donorProfile.biologicalSex,
      donationTypeName: donation.donationType?.name ?? '—',
      donatedAt: donation.donatedAt,
      centerName: donation.center?.name,
      centerCity: donation.center?.city,
      entries: donation.medicalReport.entries.map((e) => ({
        parameterName: e.parameterName,
        unit: e.unit,
        measuredValue: e.measuredValue,
        refMin: e.refMin,
        refMax: e.refMax,
      })),
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Referto donazione</h1>
        </div>
      </div>

      {/* Banner stato */}
      {hasReport && (
        <div className="flex items-center gap-4 rounded-xl border bg-green-500/5 border-green-500/20 px-5 py-5">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div className="flex-1">
            <p className="text-lg font-semibold">Referto già compilato</p>
            <p className="text-sm text-muted-foreground">
              Questa donazione ha già un referto associato.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleDownloadPdf}
            disabled={!donorProfile}
          >
            <Download className="h-4 w-4" />
            Scarica PDF
          </Button>
        </div>
      )}

      {!canCompile && !hasReport && (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 border-border px-5 py-5">
          <ClipboardList className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold">Referto non compilabile</p>
            <p className="text-sm text-muted-foreground">
              La donazione non è in stato &quot;In attesa referto&quot; (stato attuale:{' '}
              {bookingStatus ?? '—'}).
            </p>
          </div>
        </div>
      )}

      {/* Grid principale: tipo donazione + info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Banner tipo donazione */}
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 flex flex-col justify-between min-h-[180px]`}>
          <div className="bg-white/20 rounded-xl p-3 w-fit">{icon}</div>
          <div className="flex flex-col gap-1 mt-6">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Tipo donazione</p>
            <p className="text-white text-2xl font-bold leading-tight">
              {donation.donationType?.name ?? '—'}
            </p>
            <p className="text-white/70 text-sm mt-1">
              Donata il {formatDate(donation.donatedAt)}
            </p>
          </div>
        </div>

        {/* Colonna destra: sede + donatore */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 border-border">
            <CardContent className="p-5 flex items-start gap-4 h-full">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Sede di donazione</p>
                <p className="text-sm font-semibold leading-snug">
                  {donation.center?.name ?? '—'}
                </p>
                {donation.center && (
                  <p className="text-xs text-muted-foreground">
                    {donation.center.city}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 border-border">
            <CardContent className="p-5 flex items-start gap-4 h-full">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Data donazione</p>
                <p className="text-sm font-semibold capitalize">
                  {formatDate(donation.donatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card donatore */}
      <Card className="border-border">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          {donorProfile ? (
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-base font-semibold leading-tight">
                {donorProfile.firstName} {donorProfile.lastName}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                <InfoRow label="Codice fiscale" value={donorProfile.fiscalCode} />
                <InfoRow label="Data di nascita" value={formatDateShort(donorProfile.dateOfBirth)} />
                <InfoRow label="Sesso biologico" value={
                  donorProfile.biologicalSex === 'MALE' ? 'Maschio' :
                  donorProfile.biologicalSex === 'FEMALE' ? 'Femmina' : '—'
                } />
                <InfoRow label="Telefono" value={donorProfile.phone} />
                <InfoRow label="Peso" value={donorProfile.weight ? `${donorProfile.weight} kg` : null} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form referto */}
      {canCompile && (
        <Card className="border-border">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Compila referto</p>
            </div>

            {loadingParams ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <DoctorReportForm
                examParameters={examParameters}
                biologicalSex={donorProfile?.biologicalSex as 'MALE' | 'FEMALE' | null | undefined}
                onSubmit={submitReport}
                isPending={isPending}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
