'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import type { AnamnesisQuestion } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Schema form ───────────────────────────────────────────────────────────────

const questionSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, 'Formato richiesto: UPPER_SNAKE_CASE'),
  text: z.string().min(5).max(500),
  order: z.number().int().min(1),
  formVersion: z.string().min(1).max(16),
})

const updateQuestionSchema = z.object({
  text: z.string().min(5).max(500).optional(),
  order: z.number().int().min(1).optional(),
  formVersion: z.string().min(1).max(16).optional(),
})

type QuestionCreateValues = z.infer<typeof questionSchema>
type QuestionUpdateValues = z.infer<typeof updateQuestionSchema>

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchQuestions(formVersion?: string): Promise<AnamnesisQuestion[]> {
  const params: Record<string, string> = { includeInactive: 'true' }
  if (formVersion) params.formVersion = formVersion
  const { data } = await apiClient.get<AnamnesisQuestion[]>('/anamnesis/questions', { params })
  return data
}

// ── Dialog crea ───────────────────────────────────────────────────────────────

function CreateQuestionDialog({
  open,
  onOpenChange,
  filterVersion,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  filterVersion: string
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionCreateValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      code: '',
      text: '',
      order: 1,
      formVersion: filterVersion,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: QuestionCreateValues) =>
      apiClient.post('/anamnesis/questions', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'anamnesis'] })
      toast.success('Domanda creata.')
      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast.error('Errore nel salvataggio della domanda.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuova domanda anamnesi</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="q-code">Codice (UPPER_SNAKE_CASE)</FieldLabel>
              <Input
                id="q-code"
                placeholder="FEVER_LAST_WEEK"
                aria-invalid={!!errors.code}
                {...register('code')}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase()
                  register('code').onChange(e)
                }}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="q-text">Testo della domanda</FieldLabel>
              <Input
                id="q-text"
                placeholder="Hai avuto febbre negli ultimi 7 giorni?"
                aria-invalid={!!errors.text}
                {...register('text')}
              />
              <FieldError errors={[errors.text]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="q-order">Ordine</FieldLabel>
                <Input
                  id="q-order"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.order}
                  {...register('order', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.order]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="q-version">Versione modulo</FieldLabel>
                <Input
                  id="q-version"
                  placeholder="2024-01-01"
                  aria-invalid={!!errors.formVersion}
                  {...register('formVersion')}
                />
                <FieldError errors={[errors.formVersion]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Dialog modifica ───────────────────────────────────────────────────────────

function EditQuestionDialog({
  open,
  onOpenChange,
  question,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  question: AnamnesisQuestion
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuestionUpdateValues>({
    resolver: zodResolver(updateQuestionSchema),
    defaultValues: {
      text: question.text,
      order: question.order,
      formVersion: question.formVersion,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: QuestionUpdateValues) =>
      apiClient.patch(`/anamnesis/questions/${question.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'anamnesis'] })
      toast.success('Domanda aggiornata.')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Errore nel salvataggio della domanda.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifica domanda</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="eq-text">Testo della domanda</FieldLabel>
              <Input
                id="eq-text"
                placeholder="Hai avuto febbre negli ultimi 7 giorni?"
                aria-invalid={!!errors.text}
                {...register('text')}
              />
              <FieldError errors={[errors.text]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="eq-order">Ordine</FieldLabel>
                <Input
                  id="eq-order"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.order}
                  {...register('order', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.order]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="eq-version">Versione modulo</FieldLabel>
                <Input
                  id="eq-version"
                  placeholder="2024-01-01"
                  aria-invalid={!!errors.formVersion}
                  {...register('formVersion')}
                />
                <FieldError errors={[errors.formVersion]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminAnamnesisPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<AnamnesisQuestion | null>(null)
  const [deactivateQuestion, setDeactivateQuestion] = useState<AnamnesisQuestion | null>(null)
  const [filterVersion, setFilterVersion] = useState('')
  const queryClient = useQueryClient()

  const { data: questions = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'anamnesis', filterVersion],
    queryFn: () => fetchQuestions(filterVersion || undefined),
  })

  const handleVersionChange = useCallback((v: string) => {
    setFilterVersion(v)
  }, [])

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/anamnesis/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'anamnesis'] })
      toast.success('Domanda disattivata.')
      setDeactivateQuestion(null)
    },
    onError: () => {
      toast.error('Errore nella disattivazione della domanda.')
    },
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Domande anamnesi</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci le domande del questionario anamnestico.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova domanda
        </Button>
      </div>

      {/* Filtro versione */}
      <div className="flex items-center gap-3 max-w-sm">
        <Input
          placeholder="Filtra per versione (es. 2024-01-01)"
          value={filterVersion}
          onChange={(e) => handleVersionChange(e.target.value)}
        />
        {filterVersion && (
          <Button variant="ghost" size="sm" onClick={() => setFilterVersion('')}>
            Reset
          </Button>
        )}
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento delle domande.</p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna domanda trovata.</p>
      ) : (
        <div className="w-full rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide w-12">#</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Codice</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Testo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Versione</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stato</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="pl-5 py-3">
                    <span className="text-sm text-muted-foreground">{q.order}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{q.code}</code>
                  </TableCell>
                  <TableCell className="py-3 max-w-xs">
                    <span className="text-sm line-clamp-2">{q.text}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{q.formVersion}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    {q.isActive ? (
                      <Badge variant="secondary" className="text-xs">Attiva</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Inattiva</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditQuestion(q)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {q.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivateQuestion(q)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog crea */}
      <CreateQuestionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        filterVersion={filterVersion}
      />

      {/* Dialog modifica */}
      {editQuestion && (
        <EditQuestionDialog
          open={!!editQuestion}
          onOpenChange={(v) => { if (!v) setEditQuestion(null) }}
          question={editQuestion}
        />
      )}

      {/* Confirm disattiva */}
      <AlertDialog
        open={!!deactivateQuestion}
        onOpenChange={(v) => { if (!v) setDeactivateQuestion(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disattivare la domanda?</AlertDialogTitle>
            <AlertDialogDescription>
              La domanda <strong>{deactivateQuestion?.code}</strong> verrà disattivata e non sarà
              più inclusa nei nuovi questionari.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deactivateQuestion && deactivateMutation.mutate(deactivateQuestion.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disattiva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
