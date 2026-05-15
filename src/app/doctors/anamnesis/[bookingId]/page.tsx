'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface AnamnesisAnswer {
  questionCode: string
  answer: boolean
}

interface AnamnesisForm {
  id: string
  bookingId: string
  formVersion: string
  compiledAt: string
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedAt?: string | null
  reviewNote?: string | null
  answers: AnamnesisAnswer[]
}

interface AnamnesisQuestion {
  id: string
  code: string
  text: string
  order: number
  isActive: boolean
}

interface BookingDetail {
  id: string
  status: string
  slot: {
    date: string
    startTime: string
    center: { name: string; city: string }
    donationType: { name: string; code: string }
  }
  donor: {
    email?: string | null
    donorProfile?: { firstName: string | null; lastName: string | null; phone: string | null } | null
  } | null
}

// ── Schema form revisione ─────────────────────────────────────────────────────

const rejectSchema = z
  .object({
    note: z.string().max(2000).optional(),
    addExclusion: z.boolean(),
    exclusionType: z.enum(['TEMPORARY', 'PERMANENT']).optional(),
    exclusionReason: z.string().max(2000).optional(),
    exclusionStartDate: z.string().optional(),
    exclusionEndDate: z.string().optional(),
  })
  .refine(
    (d) => !d.addExclusion || !!d.exclusionReason,
    { message: 'Il motivo è obbligatorio.', path: ['exclusionReason'] },
  )
  .refine(
    (d) => !d.addExclusion || !!d.exclusionStartDate,
    { message: 'La data di inizio è obbligatoria.', path: ['exclusionStartDate'] },
  )
  .refine(
    (d) => !d.addExclusion || d.exclusionType !== 'TEMPORARY' || !!d.exclusionEndDate,
    { message: 'La data di fine è obbligatoria per esclusioni temporanee.', path: ['exclusionEndDate'] },
  )

type RejectForm = z.infer<typeof rejectSchema>

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBooking(bookingId: string): Promise<BookingDetail> {
  const { data } = await apiClient.get<BookingDetail>(`/bookings/${bookingId}`)
  return data
}

async function fetchAnamnesis(bookingId: string): Promise<AnamnesisForm> {
  const { data } = await apiClient.get<AnamnesisForm>(`/bookings/${bookingId}/anamnesis`)
  return data
}

async function fetchQuestions(): Promise<AnamnesisQuestion[]> {
  const { data } = await apiClient.get<AnamnesisQuestion[]>('/anamnesis/questions', {
    params: { includeInactive: true },
  })
  return data
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

export default function DoctorAnamnesisReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')

  const { data: booking, isLoading: loadingBooking } = useQuery({
    queryKey: ['doctor', 'booking', bookingId],
    queryFn: () => fetchBooking(bookingId),
  })

  const { data: anamnesisForm, isLoading: loadingAnamnesis } = useQuery({
    queryKey: ['doctor', 'anamnesis', bookingId],
    queryFn: () => fetchAnamnesis(bookingId),
  })

  const { data: questions = [] } = useQuery({
    queryKey: ['anamnesis', 'questions', 'all'],
    queryFn: fetchQuestions,
    staleTime: 10 * 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      note: '',
      addExclusion: false,
      exclusionType: 'TEMPORARY',
      exclusionReason: '',
      exclusionStartDate: new Date().toISOString().split('T')[0],
      exclusionEndDate: '',
    },
  })

  const watchAddExclusion = watch('addExclusion')
  const watchExclusionType = watch('exclusionType')

  // ── Mutation ──────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async (payload: {
      action: 'APPROVE' | 'REJECT'
      note?: string
      exclusion?: {
        type: 'TEMPORARY' | 'PERMANENT'
        reason: string
        startDate: string
        endDate?: string
      }
    }) => {
      await apiClient.post(`/bookings/${bookingId}/anamnesis/review`, payload)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'anamnesis'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'booking', bookingId] })
      if (vars.action === 'APPROVE') {
        toast.success('Questionario approvato. La prenotazione procede.')
      } else {
        toast.success('Questionario respinto. La prenotazione è stata cancellata.')
      }
      router.push('/doctors/anamnesis')
    },
    onError: () => {
      toast.error('Errore durante la revisione del questionario.')
    },
  })

  const handleApprove = () => {
    mutation.mutate({ action: 'APPROVE' })
  }

  const handleReject = (values: RejectForm) => {
    mutation.mutate({
      action: 'REJECT',
      note: values.note || undefined,
      exclusion: values.addExclusion
        ? {
            type: values.exclusionType!,
            reason: values.exclusionReason!,
            startDate: values.exclusionStartDate!,
            ...(values.exclusionType === 'TEMPORARY' && values.exclusionEndDate
              ? { endDate: values.exclusionEndDate }
              : {}),
          }
        : undefined,
    })
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadingBooking || loadingAnamnesis) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!booking || !anamnesisForm) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Prenotazione o questionario non trovato.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  const donorName = booking.donor?.donorProfile
    ? `${booking.donor.donorProfile.firstName ?? ''} ${booking.donor.donorProfile.lastName ?? ''}`.trim()
    : booking.donor?.email ?? '—'

  const alreadyReviewed = anamnesisForm.reviewStatus !== 'PENDING'

  const answerMap = Object.fromEntries(
    anamnesisForm.answers.map((a) => [a.questionCode, a.answer]),
  )
  const compiledQuestions = questions
    .filter((q) => q.code in answerMap)
    .sort((a, b) => a.order - b.order)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Revisione questionario</h1>
          <p className="text-sm text-muted-foreground">{donorName}</p>
        </div>
      </div>

      {/* Info prenotazione */}
      <Card className="border-border">
        <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">Donatore</p>
            <p className="text-sm font-semibold">{donorName}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">Appuntamento</p>
            <p className="text-sm font-semibold">
              {formatDate(booking.slot.date)} ore {formatTime(booking.slot.startTime)}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">Sede</p>
            <p className="text-sm font-semibold">{booking.slot.center.name}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">Tipo donazione</p>
            <p className="text-sm font-semibold">{booking.slot.donationType.name}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">Questionario compilato</p>
            <p className="text-sm font-semibold">{formatDate(anamnesisForm.compiledAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Banner: già revisionato */}
      {alreadyReviewed && (
        <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${
          anamnesisForm.reviewStatus === 'APPROVED'
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-destructive/5 border-destructive/20'
        }`}>
          {anamnesisForm.reviewStatus === 'APPROVED'
            ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            : <XCircle className="h-5 w-5 text-destructive shrink-0" />
          }
          <div>
            <p className="text-sm font-semibold">
              {anamnesisForm.reviewStatus === 'APPROVED' ? 'Questionario approvato' : 'Questionario respinto'}
            </p>
            {anamnesisForm.reviewNote && (
              <p className="text-xs text-muted-foreground mt-0.5">{anamnesisForm.reviewNote}</p>
            )}
          </div>
        </div>
      )}

      {/* Risposte questionario */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Risposte del donatore</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {compiledQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna risposta disponibile.</p>
          ) : (
            compiledQuestions.map((q) => {
              const answer = answerMap[q.code]
              return (
                <div
                  key={q.code}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
                >
                  <p className="text-sm leading-snug">{q.text}</p>
                  <Badge variant={answer ? 'destructive' : 'secondary'} className="shrink-0">
                    {answer ? 'Sì' : 'No'}
                  </Badge>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Azioni revisione — solo se ancora PENDING */}
      {!alreadyReviewed && (
        <>
          {/* Approva */}
          {mode !== 'reject' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setMode('approve')
                  handleApprove()
                }}
                disabled={mutation.isPending}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {mutation.isPending && mode === 'approve' ? 'Approvazione…' : 'Approva questionario'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode('reject')}
                disabled={mutation.isPending}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Respingi questionario
              </Button>
            </div>
          )}

          {/* Form rifiuto */}
          {mode === 'reject' && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive">Respingi questionario</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleReject)} className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="reject-note">Nota (opzionale)</FieldLabel>
                    <Textarea
                      id="reject-note"
                      placeholder="Motivo del rifiuto visibile negli audit log…"
                      className="min-h-[80px]"
                      {...register('note')}
                    />
                  </Field>

                  {/* Esclusione opzionale */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="add-exclusion"
                      checked={watchAddExclusion}
                      onChange={(e) => setValue('addExclusion', e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <label htmlFor="add-exclusion" className="text-sm font-medium cursor-pointer">
                      Aggiungi esclusione al donatore
                    </label>
                  </div>

                  {watchAddExclusion && (
                    <div className="flex flex-col gap-3 pl-6 border-l-2 border-destructive/30">
                      <Field>
                        <FieldLabel>Tipo esclusione</FieldLabel>
                        <Select
                          value={watchExclusionType}
                          onValueChange={(v) => setValue('exclusionType', v as 'TEMPORARY' | 'PERMANENT')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEMPORARY">Temporanea</SelectItem>
                            <SelectItem value="PERMANENT">Permanente</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="excl-reason">Motivo esclusione</FieldLabel>
                        <Textarea
                          id="excl-reason"
                          placeholder="Descrivi il motivo clinico…"
                          className="min-h-[70px]"
                          {...register('exclusionReason')}
                        />
                        {errors.exclusionReason && (
                          <FieldError>{errors.exclusionReason.message}</FieldError>
                        )}
                      </Field>

                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="excl-start">Data inizio</FieldLabel>
                          <Input id="excl-start" type="date" {...register('exclusionStartDate')} />
                          {errors.exclusionStartDate && (
                            <FieldError>{errors.exclusionStartDate.message}</FieldError>
                          )}
                        </Field>

                        {watchExclusionType === 'TEMPORARY' && (
                          <Field>
                            <FieldLabel htmlFor="excl-end">Data fine</FieldLabel>
                            <Input id="excl-end" type="date" {...register('exclusionEndDate')} />
                            {errors.exclusionEndDate && (
                              <FieldError>{errors.exclusionEndDate.message}</FieldError>
                            )}
                          </Field>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? 'Rifiuto in corso…' : 'Conferma rifiuto'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMode('idle')}
                      disabled={mutation.isPending}
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
