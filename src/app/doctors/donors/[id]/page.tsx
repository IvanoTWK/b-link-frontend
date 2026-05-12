'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { apiClient } from '@/lib/api/axios'
import { formatBloodGroup } from '@/lib/utils/blood-group'
import type { DonorProfile, ClinicalNote, Exclusion, CreateClinicalNoteDto, CreateExclusionDto } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Schemi Zod ────────────────────────────────────────────────────────────────

const noteSchema = z.object({
  content: z.string().min(1, 'Il contenuto è obbligatorio').max(5000),
})

const exclusionSchema = z
  .object({
    type: z.enum(['TEMPORARY', 'PERMANENT']),
    reason: z.string().min(1, 'Il motivo è obbligatorio').max(2000),
    startDate: z.string().min(1, 'La data di inizio è obbligatoria'),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => !(data.type === 'TEMPORARY' && !data.endDate),
    {
      message: 'La data di fine è obbligatoria per esclusioni temporanee.',
      path: ['endDate'],
    },
  )

type NoteForm = z.infer<typeof noteSchema>
type ExclusionForm = z.infer<typeof exclusionSchema>

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchDonorProfile(userId: string): Promise<DonorProfile> {
  const { data } = await apiClient.get<DonorProfile>(`/donors/${userId}/profile`)
  return data
}

async function fetchNotes(donorId: string): Promise<ClinicalNote[]> {
  const { data } = await apiClient.get<ClinicalNote[]>('/medical/notes', {
    params: { donorId },
  })
  return data
}

async function fetchExclusions(donorId: string): Promise<Exclusion[]> {
  const { data } = await apiClient.get<Exclusion[]>('/medical/exclusions', {
    params: { donorId },
  })
  return data
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold">{value ?? '—'}</p>
    </div>
  )
}

// ── Form nota clinica ──────────────────────────────────────────────────────────

function AddNoteDialog({ donorId }: { donorId: string }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '' },
  })

  const mutation = useMutation({
    mutationFn: (dto: CreateClinicalNoteDto) =>
      apiClient.post('/medical/notes', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'notes', donorId] })
      reset()
      setOpen(false)
    },
  })

  const onSubmit = (values: NoteForm) => {
    mutation.mutate({ donorId, content: values.content })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Nuova nota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi nota clinica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="note-content">Contenuto</FieldLabel>
            <Textarea
              id="note-content"
              placeholder="Inserisci la nota clinica..."
              className="min-h-[120px]"
              {...register('content')}
            />
            {errors.content && <FieldError>{errors.content.message}</FieldError>}
          </Field>
          {mutation.isError && (
            <p className="text-sm text-destructive">Errore nel salvataggio della nota.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvataggio...' : 'Salva nota'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Form esclusione ────────────────────────────────────────────────────────────

function AddExclusionDialog({ donorId }: { donorId: string }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExclusionForm>({
    resolver: zodResolver(exclusionSchema),
    defaultValues: {
      type: 'TEMPORARY',
      reason: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  })

  const watchType = watch('type')

  const mutation = useMutation({
    mutationFn: (dto: CreateExclusionDto) =>
      apiClient.post('/medical/exclusions', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'exclusions', donorId] })
      reset()
      setOpen(false)
    },
  })

  const onSubmit = (values: ExclusionForm) => {
    const dto: CreateExclusionDto = {
      donorId,
      type: values.type,
      reason: values.reason,
      startDate: values.startDate,
      ...(values.type === 'TEMPORARY' && values.endDate
        ? { endDate: values.endDate }
        : {}),
    }
    mutation.mutate(dto)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Nuova esclusione
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi esclusione</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="excl-type">Tipo</FieldLabel>
            <Select
              value={watchType}
              onValueChange={(v) => setValue('type', v as 'TEMPORARY' | 'PERMANENT')}
            >
              <SelectTrigger id="excl-type">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEMPORARY">Temporanea</SelectItem>
                <SelectItem value="PERMANENT">Permanente</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <FieldError>{errors.type.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="excl-reason">Motivo</FieldLabel>
            <Textarea
              id="excl-reason"
              placeholder="Descrivi il motivo dell'esclusione..."
              className="min-h-[80px]"
              {...register('reason')}
            />
            {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="excl-start">Data inizio</FieldLabel>
            <Input id="excl-start" type="date" {...register('startDate')} />
            {errors.startDate && <FieldError>{errors.startDate.message}</FieldError>}
          </Field>

          {watchType === 'TEMPORARY' && (
            <Field>
              <FieldLabel htmlFor="excl-end">Data fine</FieldLabel>
              <Input id="excl-end" type="date" {...register('endDate')} />
              {errors.endDate && <FieldError>{errors.endDate.message}</FieldError>}
            </Field>
          )}

          {mutation.isError && (
            <p className="text-sm text-destructive">Errore nel salvataggio dell&apos;esclusione.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvataggio...' : 'Salva esclusione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Chiudi esclusione ──────────────────────────────────────────────────────────

function CloseExclusionButton({ exclusionId, donorId }: { exclusionId: string; donorId: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/medical/exclusions/${exclusionId}/close`, {
        endDate: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'exclusions', donorId] })
    },
  })

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      <X className="h-3 w-3 mr-1" />
      Chiudi
    </Button>
  )
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function DoctorDonorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: profile, isLoading: loadingProfile, isError: errorProfile } = useQuery({
    queryKey: ['doctor', 'donor-profile', id],
    queryFn: () => fetchDonorProfile(id),
  })

  const { data: notes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['doctor', 'notes', id],
    queryFn: () => fetchNotes(id),
    enabled: !!profile,
  })

  const { data: exclusions = [], isLoading: loadingExclusions } = useQuery({
    queryKey: ['doctor', 'exclusions', id],
    queryFn: () => fetchExclusions(id),
    enabled: !!profile,
  })

  if (loadingProfile) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (errorProfile || !profile) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Profilo donatore non trovato.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  const donorId = profile.userId

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">Scheda clinica donatore</p>
        </div>
      </div>

      {/* Dati anagrafici + clinici */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dati anagrafici e clinici</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoRow label="Nome" value={profile.firstName} />
            <InfoRow label="Cognome" value={profile.lastName} />
            <InfoRow label="Codice fiscale" value={profile.fiscalCode} />
            <InfoRow
              label="Data di nascita"
              value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null}
            />
            <InfoRow label="Luogo di nascita" value={(profile as DonorProfile & { placeOfBirth?: string }).placeOfBirth} />
            <InfoRow
              label="Sesso biologico"
              value={profile.biologicalSex === 'MALE' ? 'Maschio' : profile.biologicalSex === 'FEMALE' ? 'Femmina' : null}
            />
            <InfoRow
              label="Gruppo sanguigno"
              value={formatBloodGroup(profile.bloodGroup)}
            />
            <InfoRow
              label="Peso (kg)"
              value={profile.weight != null ? String(profile.weight) : null}
            />
            <InfoRow label="Telefono" value={profile.phone} />
          </div>
        </CardContent>
      </Card>

      {/* Note cliniche + Esclusioni — stessa riga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

        {/* Note cliniche */}
        <Card className="border-border h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Note cliniche</CardTitle>
              <AddNoteDialog donorId={donorId} />
            </div>
          </CardHeader>
          <CardContent>
            {loadingNotes ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna nota clinica presente.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border p-4 flex flex-col gap-1"
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Esclusioni */}
        <Card className="border-border h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Esclusioni</CardTitle>
              <AddExclusionDialog donorId={donorId} />
            </div>
          </CardHeader>
          <CardContent>
            {loadingExclusions ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : exclusions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna esclusione attiva.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {exclusions.map((excl) => (
                  <div
                    key={excl.id}
                    className="rounded-lg border border-border p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={excl.type === 'PERMANENT' ? 'destructive' : 'secondary'}
                        >
                          {excl.type === 'PERMANENT' ? 'Permanente' : 'Temporanea'}
                        </Badge>
                        {excl.isActive && (
                          <Badge variant="outline" className="text-amber-600 border-amber-400">
                            Attiva
                          </Badge>
                        )}
                      </div>
                      {excl.type === 'TEMPORARY' && excl.isActive && (
                        <CloseExclusionButton exclusionId={excl.id} donorId={donorId} />
                      )}
                    </div>
                    <p className="text-sm">{excl.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Dal {formatDate(excl.startDate)}
                      {excl.endDate ? ` al ${formatDate(excl.endDate)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
