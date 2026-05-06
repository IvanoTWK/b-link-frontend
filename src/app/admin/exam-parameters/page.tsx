'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TablePaginator } from '@/components/ui/table-paginator'
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

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface ExamParameter {
  id: string
  name: string
  unit: string
  refMinMale: number
  refMaxMale: number
  refMinFemale: number
  refMaxFemale: number
  isActive: boolean
}

// ── Schema form ───────────────────────────────────────────────────────────────

const paramSchema = z
  .object({
    name: z.string().min(2).max(100),
    unit: z.string().min(1).max(20),
    refMinMale: z.number(),
    refMaxMale: z.number(),
    refMinFemale: z.number(),
    refMaxFemale: z.number(),
  })
  .refine((d) => d.refMaxMale > d.refMinMale, {
    message: 'Il massimo deve essere maggiore del minimo',
    path: ['refMaxMale'],
  })
  .refine((d) => d.refMaxFemale > d.refMinFemale, {
    message: 'Il massimo deve essere maggiore del minimo',
    path: ['refMaxFemale'],
  })

type ParamFormValues = z.infer<typeof paramSchema>

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchParams(): Promise<ExamParameter[]> {
  const { data } = await apiClient.get<ExamParameter[]>('/exam-parameters')
  return data
}

// ── Dialog crea/modifica ──────────────────────────────────────────────────────

function ParamDialog({
  open,
  onOpenChange,
  param,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  param?: ExamParameter
}) {
  const queryClient = useQueryClient()
  const isEdit = !!param

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParamFormValues>({
    resolver: zodResolver(paramSchema),
    defaultValues: {
      name: param?.name ?? '',
      unit: param?.unit ?? '',
      refMinMale: param?.refMinMale ?? 0,
      refMaxMale: param?.refMaxMale ?? 0,
      refMinFemale: param?.refMinFemale ?? 0,
      refMaxFemale: param?.refMaxFemale ?? 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: ParamFormValues) =>
      isEdit
        ? apiClient.patch(`/exam-parameters/${param!.id}`, values)
        : apiClient.post('/exam-parameters', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exam-parameters'] })
      toast.success(isEdit ? 'Parametro aggiornato.' : 'Parametro creato.')
      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast.error('Errore nel salvataggio del parametro.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica parametro' : 'Nuovo parametro lab'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="p-name">Nome</FieldLabel>
                <Input
                  id="p-name"
                  placeholder="Emoglobina"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-unit">Unità di misura</FieldLabel>
                <Input
                  id="p-unit"
                  placeholder="g/dL"
                  aria-invalid={!!errors.unit}
                  {...register('unit')}
                />
                <FieldError errors={[errors.unit]} />
              </Field>
            </div>

            <p className="text-sm font-medium text-muted-foreground">Range riferimento — Uomo</p>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="p-min-male">Min (uomo)</FieldLabel>
                <Input
                  id="p-min-male"
                  type="number"
                  step="0.1"
                  aria-invalid={!!errors.refMinMale}
                  {...register('refMinMale', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.refMinMale]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-max-male">Max (uomo)</FieldLabel>
                <Input
                  id="p-max-male"
                  type="number"
                  step="0.1"
                  aria-invalid={!!errors.refMaxMale}
                  {...register('refMaxMale', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.refMaxMale]} />
              </Field>
            </div>

            <p className="text-sm font-medium text-muted-foreground">Range riferimento — Donna</p>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="p-min-female">Min (donna)</FieldLabel>
                <Input
                  id="p-min-female"
                  type="number"
                  step="0.1"
                  aria-invalid={!!errors.refMinFemale}
                  {...register('refMinFemale', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.refMinFemale]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="p-max-female">Max (donna)</FieldLabel>
                <Input
                  id="p-max-female"
                  type="number"
                  step="0.1"
                  aria-invalid={!!errors.refMaxFemale}
                  {...register('refMaxFemale', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.refMaxFemale]} />
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

export default function AdminExamParametersPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editParam, setEditParam] = useState<ExamParameter | null>(null)
  const [deactivateParam, setDeactivateParam] = useState<ExamParameter | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  const { data: params = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'exam-parameters'],
    queryFn: fetchParams,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/exam-parameters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exam-parameters'] })
      toast.success('Parametro disattivato.')
      setDeactivateParam(null)
    },
    onError: () => {
      toast.error('Errore nella disattivazione del parametro.')
    },
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Parametri lab</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i parametri di laboratorio e i range di riferimento.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo parametro
        </Button>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento dei parametri.</p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : params.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun parametro trovato.</p>
      ) : (
        <div className="flex flex-col gap-3">
        <div className="w-full rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unità</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Range uomo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Range donna</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stato</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {params.slice(page * pageSize, (page + 1) * pageSize).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-5 py-3">
                    <span className="text-sm font-semibold">{p.name}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.unit}</code>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">
                      {p.refMinMale} – {p.refMaxMale}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">
                      {p.refMinFemale} – {p.refMaxFemale}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {p.isActive ? (
                      <Badge variant="secondary" className="text-xs">Attivo</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Inattivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditParam(p)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {p.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivateParam(p)}
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
        <TablePaginator
          page={page}
          pageSize={pageSize}
          total={params.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
        </div>
      )}

      {/* Dialog crea */}
      <ParamDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Dialog modifica */}
      {editParam && (
        <ParamDialog
          open={!!editParam}
          onOpenChange={(v) => { if (!v) setEditParam(null) }}
          param={editParam}
        />
      )}

      {/* Confirm disattiva */}
      <AlertDialog
        open={!!deactivateParam}
        onOpenChange={(v) => { if (!v) setDeactivateParam(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disattivare il parametro?</AlertDialogTitle>
            <AlertDialogDescription>
              Il parametro <strong>{deactivateParam?.name}</strong> verrà disattivato e non sarà
              più disponibile per i nuovi referti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateParam && deactivateMutation.mutate(deactivateParam.id)}
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
