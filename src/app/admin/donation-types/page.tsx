'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import type { DonationType } from '@/lib/types'
import { TablePaginator } from '@/components/ui/table-paginator'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface DonationTypeInterval {
  id: string
  fromTypeId: string
  toTypeId: string
  intervalDays: number
}

interface DonationTypeWithIntervals extends DonationType {
  intervalsFrom: DonationTypeInterval[]
  intervalsTo: DonationTypeInterval[]
}

// ── Schemi form ───────────────────────────────────────────────────────────────

const donationTypeSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(2).max(100),
  minIntervalDays: z.number().int().positive(),
  maxPerYearMale: z.number().int().positive(),
  maxPerYearFemaleFertile: z.number().int().positive(),
  maxPerYearFemaleNonFertile: z.number().int().positive(),
  minWeightKg: z.number().positive(),
})

const updateDonationTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  minIntervalDays: z.number().int().positive().optional(),
  maxPerYearMale: z.number().int().positive().optional(),
  maxPerYearFemaleFertile: z.number().int().positive().optional(),
  maxPerYearFemaleNonFertile: z.number().int().positive().optional(),
  minWeightKg: z.number().positive().optional(),
})

const intervalSchema = z.object({
  fromTypeId: z.string().uuid(),
  toTypeId: z.string().uuid(),
  minIntervalDays: z.number().int().positive(),
})

type DonationTypeCreateValues = z.infer<typeof donationTypeSchema>
type DonationTypeUpdateValues = z.infer<typeof updateDonationTypeSchema>
type IntervalFormValues = z.infer<typeof intervalSchema>

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchDonationTypes(): Promise<DonationType[]> {
  const { data } = await apiClient.get<DonationType[]>('/donation-types')
  return data
}

// ── Dialog crea tipo ──────────────────────────────────────────────────────────

function CreateDonationTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DonationTypeCreateValues>({
    resolver: zodResolver(donationTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      minIntervalDays: 90,
      maxPerYearMale: 4,
      maxPerYearFemaleFertile: 2,
      maxPerYearFemaleNonFertile: 4,
      minWeightKg: 50,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: DonationTypeCreateValues) =>
      apiClient.post('/donation-types', { ...values, code: values.code.toUpperCase() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donation-types'] })
      toast.success('Tipo donazione creato.')
      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast.error('Errore nel salvataggio.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuovo tipo donazione</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dt-code">Codice (es. SANGUE_INTERO)</FieldLabel>
              <Input
                id="dt-code"
                placeholder="SANGUE_INTERO"
                aria-invalid={!!errors.code}
                {...register('code')}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase()
                  e.target.value = upper
                  register('code').onChange(e)
                }}
              />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="dt-name">Nome</FieldLabel>
              <Input
                id="dt-name"
                placeholder="Sangue Intero"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="dt-interval">Intervallo min. (giorni)</FieldLabel>
                <Input
                  id="dt-interval"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.minIntervalDays}
                  {...register('minIntervalDays', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.minIntervalDays]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dt-weight">Peso min. (kg)</FieldLabel>
                <Input
                  id="dt-weight"
                  type="number"
                  min={1}
                  step="0.1"
                  aria-invalid={!!errors.minWeightKg}
                  {...register('minWeightKg', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.minWeightKg]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dt-male">Max/anno uomo</FieldLabel>
                <Input
                  id="dt-male"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.maxPerYearMale}
                  {...register('maxPerYearMale', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxPerYearMale]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dt-female-fertile">Max/anno donna fertile</FieldLabel>
                <Input
                  id="dt-female-fertile"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.maxPerYearFemaleFertile}
                  {...register('maxPerYearFemaleFertile', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxPerYearFemaleFertile]} />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="dt-female-non-fertile">Max/anno donna non fertile</FieldLabel>
                <Input
                  id="dt-female-non-fertile"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.maxPerYearFemaleNonFertile}
                  {...register('maxPerYearFemaleNonFertile', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxPerYearFemaleNonFertile]} />
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

// ── Dialog modifica tipo ──────────────────────────────────────────────────────

function EditDonationTypeDialog({
  open,
  onOpenChange,
  donationType,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  donationType: DonationType
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DonationTypeUpdateValues>({
    resolver: zodResolver(updateDonationTypeSchema),
    defaultValues: {
      name: donationType.name,
      minIntervalDays: donationType.minIntervalDays,
      maxPerYearMale: donationType.maxPerYearMale,
      maxPerYearFemaleFertile: donationType.maxPerYearFemaleFertile,
      maxPerYearFemaleNonFertile: donationType.maxPerYearFemaleNonFertile,
      minWeightKg: donationType.minWeightKg,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: DonationTypeUpdateValues) =>
      apiClient.patch(`/donation-types/${donationType.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donation-types'] })
      toast.success('Tipo donazione aggiornato.')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Errore nel salvataggio.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifica tipo donazione</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-name">Nome</FieldLabel>
              <Input
                id="edit-name"
                placeholder="Sangue Intero"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="edit-interval">Intervallo min. (giorni)</FieldLabel>
                <Input
                  id="edit-interval"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.minIntervalDays}
                  {...register('minIntervalDays', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.minIntervalDays]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-weight">Peso min. (kg)</FieldLabel>
                <Input
                  id="edit-weight"
                  type="number"
                  min={1}
                  step="0.1"
                  aria-invalid={!!errors.minWeightKg}
                  {...register('minWeightKg', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.minWeightKg]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-male">Max/anno uomo</FieldLabel>
                <Input
                  id="edit-male"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.maxPerYearMale}
                  {...register('maxPerYearMale', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxPerYearMale]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-fertile">Max/anno donna fertile</FieldLabel>
                <Input
                  id="edit-fertile"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.maxPerYearFemaleFertile}
                  {...register('maxPerYearFemaleFertile', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxPerYearFemaleFertile]} />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="edit-non-fertile">Max/anno donna non fertile</FieldLabel>
                <Input
                  id="edit-non-fertile"
                  type="number"
                  min={1}
                  aria-invalid={!!errors.maxPerYearFemaleNonFertile}
                  {...register('maxPerYearFemaleNonFertile', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.maxPerYearFemaleNonFertile]} />
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

// ── Dialog crea intervallo ────────────────────────────────────────────────────

function IntervalDialog({
  open,
  onOpenChange,
  types,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  types: DonationType[]
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IntervalFormValues>({
    resolver: zodResolver(intervalSchema),
    defaultValues: {
      fromTypeId: '',
      toTypeId: '',
      minIntervalDays: 30,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: IntervalFormValues) =>
      apiClient.post('/donation-types/intervals', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donation-types'] })
      toast.success('Intervallo incrociato creato.')
      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast.error("Errore nella creazione dell'intervallo.")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo intervallo incrociato</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Tipo sorgente (dopo questa donazione)</FieldLabel>
              <Select onValueChange={(v) => setValue('fromTypeId', v, { shouldValidate: true })}>
                <SelectTrigger aria-invalid={!!errors.fromTypeId}>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.fromTypeId]} />
            </Field>
            <Field>
              <FieldLabel>Tipo destinazione (prima di questa)</FieldLabel>
              <Select onValueChange={(v) => setValue('toTypeId', v, { shouldValidate: true })}>
                <SelectTrigger aria-invalid={!!errors.toTypeId}>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.toTypeId]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="iv-days">Giorni di attesa minimi</FieldLabel>
              <Input
                id="iv-days"
                type="number"
                min={1}
                aria-invalid={!!errors.minIntervalDays}
                {...register('minIntervalDays', { valueAsNumber: true })}
              />
              <FieldError errors={[errors.minIntervalDays]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Creazione...' : 'Crea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Riga espandibile con intervalli ──────────────────────────────────────────

function DonationTypeRow({
  dt,
  allTypes,
  onEdit,
  onDelete,
}: {
  dt: DonationTypeWithIntervals
  allTypes: DonationType[]
  onEdit: (dt: DonationType) => void
  onDelete: (dt: DonationType) => void
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteIntervalMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/donation-types/intervals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donation-types'] })
      toast.success('Intervallo eliminato.')
    },
    onError: () => toast.error('Errore eliminazione intervallo.'),
  })

  const getTypeName = (id: string) => allTypes.find((t) => t.id === id)?.name ?? id

  const hasIntervals = dt.intervalsFrom.length > 0 || dt.intervalsTo.length > 0

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <>
        <TableRow>
          <TableCell className="pl-5 py-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
                {hasIntervals ? (
                  open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                ) : (
                  <span className="w-4" />
                )}
                {dt.name}
              </button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell className="py-3">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{dt.code}</code>
          </TableCell>
          <TableCell className="py-3">
            <span className="text-sm">{dt.minIntervalDays}gg</span>
          </TableCell>
          <TableCell className="py-3">
            <span className="text-sm">{dt.minWeightKg}kg</span>
          </TableCell>
          <TableCell className="py-3">
            {dt.isActive ? (
              <Badge variant="secondary" className="text-xs">Attivo</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">Inattivo</Badge>
            )}
          </TableCell>
          <TableCell className="py-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(dt)} className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(dt)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableCell colSpan={6} className="pl-12 py-3">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Intervalli incrociati
                </p>
                {dt.intervalsFrom.length === 0 && dt.intervalsTo.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nessun intervallo incrociato.</p>
                )}
                {dt.intervalsFrom.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      Dopo <strong>{dt.name}</strong> → aspetta {iv.intervalDays}gg prima di{' '}
                      <strong>{getTypeName(iv.toTypeId)}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteIntervalMutation.mutate(iv.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {dt.intervalsTo.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      Dopo <strong>{getTypeName(iv.fromTypeId)}</strong> → aspetta {iv.intervalDays}
                      gg prima di <strong>{dt.name}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteIntervalMutation.mutate(iv.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminDonationTypesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editType, setEditType] = useState<DonationType | null>(null)
  const [deleteType, setDeleteType] = useState<DonationType | null>(null)
  const [intervalOpen, setIntervalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  const { data: types = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'donation-types'],
    queryFn: fetchDonationTypes,
  })

  const { data: typesWithIntervals = [], isLoading: isLoadingDetails } = useQuery({
    queryKey: ['admin', 'donation-types', 'details'],
    queryFn: async () => {
      const results = await Promise.all(
        types.map((t) =>
          apiClient
            .get<DonationTypeWithIntervals>(`/donation-types/${t.id}`)
            .then((r) => r.data),
        ),
      )
      return results
    },
    enabled: types.length > 0,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`/donation-types/${id}`, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'donation-types'] })
      toast.success('Tipo donazione disattivato.')
      setDeleteType(null)
    },
    onError: () => {
      toast.error('Impossibile disattivare il tipo donazione.')
    },
  })

  const loading = isLoading || isLoadingDetails

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Tipi donazione</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i tipi di donazione e gli intervalli incrociati.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIntervalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Intervallo incrociato
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo tipo
          </Button>
        </div>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento dei tipi donazione.</p>
      )}

      {/* Tabella */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : typesWithIntervals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun tipo donazione trovato.</p>
      ) : (
        <div className="flex flex-col gap-3">
        <div className="w-full rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Codice</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intervallo min.</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Peso min.</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stato</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typesWithIntervals.slice(page * pageSize, (page + 1) * pageSize).map((dt) => (
                <DonationTypeRow
                  key={dt.id}
                  dt={dt}
                  allTypes={types}
                  onEdit={setEditType}
                  onDelete={setDeleteType}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePaginator
          page={page}
          pageSize={pageSize}
          total={typesWithIntervals.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
        </div>
      )}

      {/* Dialog crea */}
      <CreateDonationTypeDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Dialog modifica */}
      {editType && (
        <EditDonationTypeDialog
          open={!!editType}
          onOpenChange={(v) => { if (!v) setEditType(null) }}
          donationType={editType}
        />
      )}

      {/* Dialog intervallo */}
      <IntervalDialog open={intervalOpen} onOpenChange={setIntervalOpen} types={types} />

      {/* Confirm disattiva */}
      <AlertDialog open={!!deleteType} onOpenChange={(v) => { if (!v) setDeleteType(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disattivare il tipo donazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Il tipo <strong>{deleteType?.name}</strong> verrà disattivato e non sarà più
              selezionabile per nuovi slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteType && deactivateMutation.mutate(deleteType.id)}
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
