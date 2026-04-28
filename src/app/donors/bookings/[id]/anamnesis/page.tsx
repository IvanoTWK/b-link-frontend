'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CheckCircle2, ChevronLeft, ClipboardList, XCircle,
} from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { AnamnesisQuestion, Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.get<Booking>(`/bookings/${id}`)
  return data
}

async function fetchQuestions(): Promise<AnamnesisQuestion[]> {
  const { data } = await apiClient.get<AnamnesisQuestion[]>('/anamnesis/questions')
  return data
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AnamnesisPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['donor', 'booking', id],
    queryFn: () => fetchBooking(id),
  })

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['anamnesis', 'questions'],
    queryFn: fetchQuestions,
  })

  const isLoading = bookingLoading || questionsLoading

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!questions || questions.length === 0) return

    const formVersion = questions[0].formVersion
    const payload = {
      formVersion,
      answers: questions.map((q) => ({
        questionCode: q.code,
        answer: answers[q.code] ?? false,
      })),
    }

    setSubmitting(true)
    try {
      await apiClient.post(`/bookings/${id}/anamnesis`, payload)
      await queryClient.invalidateQueries({ queryKey: ['donor', 'booking', id] })
      toast.success('Questionario inviato con successo.')
      router.push(`/donors/bookings/${id}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message ?? 'Errore durante l\'invio del questionario.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!booking || !questions) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Impossibile caricare il questionario.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  const alreadyCompiled = !!booking.anamnesisForm
  const canFill = booking.status === 'CONFIRMED'
  const activeQuestions = questions.filter((q) => q.isActive).sort((a, b) => a.order - b.order)

  // ── Read-only: già compilato ───────────────────────────────────────────────

  if (alreadyCompiled) {
    const form = booking.anamnesisForm!
    const answerMap = Object.fromEntries(form.answers.map((a) => [a.questionCode, a.answer]))

    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Questionario anamnestico</h1>
            <p className="text-xs text-muted-foreground">
              Compilato il {new Date(form.compiledAt).toLocaleDateString('it-IT', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {activeQuestions.map((q) => {
            const answer = answerMap[q.code] ?? false
            return (
              <div
                key={q.code}
                className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5"
              >
                <p className="text-sm leading-snug">{q.text}</p>
                <Badge variant={answer ? 'destructive' : 'secondary'} className="shrink-0">
                  {answer ? 'Sì' : 'No'}
                </Badge>
              </div>
            )
          })}
        </div>

        <Button variant="outline" size="sm" className="w-fit" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna alla prenotazione
        </Button>
      </div>
    )
  }

  // ── Booking non confermata ─────────────────────────────────────────────────

  if (!canFill) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Questionario anamnestico</h1>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4">
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm">
            Il questionario è disponibile solo per prenotazioni confermate.
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Questionario anamnestico</h1>
          <p className="text-xs text-muted-foreground">
            Rispondi sinceramente a tutte le domande prima della donazione.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4">
        <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Attiva il toggle solo se la risposta è <span className="font-semibold text-foreground">Sì</span>.
          Le risposte verranno trasmesse al personale medico.
        </p>
      </div>

      {/* Domande */}
      <div className="flex flex-col gap-3">
        {activeQuestions.map((q) => {
          const value = answers[q.code] ?? false
          return (
            <div
              key={q.code}
              className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5 transition-colors data-[active=true]:border-destructive/40 data-[active=true]:bg-destructive/5"
              data-active={value}
            >
              <label htmlFor={q.code} className="text-sm leading-snug cursor-pointer flex-1">
                {q.text}
              </label>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground w-4 text-right">
                  {value ? 'Sì' : 'No'}
                </span>
                <Switch
                  id={q.code}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setAnswers((prev) => ({ ...prev, [q.code]: checked }))
                  }
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Conferma */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            'Invio in corso...'
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Invia questionario
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={submitting}>
          Annulla
        </Button>
      </div>

    </div>
  )
}
