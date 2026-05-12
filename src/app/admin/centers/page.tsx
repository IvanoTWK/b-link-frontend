'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import type { Center } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { TablePaginator } from '@/components/ui/table-paginator'
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

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedCenters {
  items: Center[]
  nextCursor: string | null
}

// ── Schema form ───────────────────────────────────────────────────────────────

const centerSchema = z.object({
  name: z.string().min(2).max(200),
  city: z.string().min(2).max(100),
  address: z.string().min(5).max(300),
  phone: z.string().min(5).max(30),
  email: z.string().email('Email non valida'),
  notificationEmail: z.string().email('Email notifiche non valida'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

type CenterFormValues = z.infer<typeof centerSchema>

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchCenters(): Promise<PaginatedCenters> {
  const { data } = await apiClient.get<PaginatedCenters>('/centers', {
    params: { limit: 100 },
  })
  return data
}

// ── Dialog crea/modifica ──────────────────────────────────────────────────────

function CenterDialog({
  open,
  onOpenChange,
  center,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  center?: Center
}) {
  const queryClient = useQueryClient()
  const isEdit = !!center

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CenterFormValues>({
    resolver: zodResolver(centerSchema),
    defaultValues: {
      name: center?.name ?? '',
      city: center?.city ?? '',
      address: center?.address ?? '',
      phone: center?.phone ?? '',
      email: center?.email ?? '',
      notificationEmail: center?.notificationEmail ?? '',
      latitude: center?.latitude ?? undefined,
      longitude: center?.longitude ?? undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: CenterFormValues) =>
      isEdit
        ? apiClient.patch(`/centers/${center!.id}`, values)
        : apiClient.post('/centers', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] })
      toast.success(isEdit ? 'Centro aggiornato.' : 'Centro creato.')
      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast.error(isEdit ? 'Errore aggiornamento centro.' : 'Errore creazione centro.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica centro' : 'Nuovo centro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field className="col-span-2">
                <FieldLabel htmlFor="name">Nome</FieldLabel>
                <Input
                  id="name"
                  placeholder="Centro Trasfusionale Milano"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="city">Città</FieldLabel>
                <Input
                  id="city"
                  placeholder="Milano"
                  aria-invalid={!!errors.city}
                  {...register('city')}
                />
                <FieldError errors={[errors.city]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Indirizzo</FieldLabel>
                <Input
                  id="address"
                  placeholder="Via Roma 1"
                  aria-invalid={!!errors.address}
                  {...register('address')}
                />
                <FieldError errors={[errors.address]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Telefono</FieldLabel>
                <Input
                  id="phone"
                  placeholder="+39 02 1234567"
                  aria-invalid={!!errors.phone}
                  {...register('phone')}
                />
                <FieldError errors={[errors.phone]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email pubblica</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="centro@blink.it"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="notificationEmail">Email notifiche prenotazioni</FieldLabel>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="notifiche@blink.it"
                  aria-invalid={!!errors.notificationEmail}
                  {...register('notificationEmail')}
                />
                <FieldError errors={[errors.notificationEmail]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="latitude">Latitudine (opz.)</FieldLabel>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="45.46"
                  aria-invalid={!!errors.latitude}
                  {...register('latitude', { valueAsNumber: true, setValueAs: (v) => v === '' || v === undefined ? undefined : Number(v) })}
                />
                <FieldError errors={[errors.latitude]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="longitude">Longitudine (opz.)</FieldLabel>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="9.18"
                  aria-invalid={!!errors.longitude}
                  {...register('longitude', { valueAsNumber: true, setValueAs: (v) => v === '' || v === undefined ? undefined : Number(v) })}
                />
                <FieldError errors={[errors.longitude]} />
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

export default function AdminCentersPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editCenter, setEditCenter] = useState<Center | null>(null)
  const [deleteCenter, setDeleteCenter] = useState<Center | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'centers'],
    queryFn: fetchCenters,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/centers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] })
      toast.success('Centro disattivato.')
      setDeleteCenter(null)
    },
    onError: () => {
      toast.error('Impossibile disattivare il centro. Potrebbero esistere slot futuri attivi.')
    },
  })

  const centers = data?.items ?? []

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Centri</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i centri trasfusionali della piattaforma.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo centro
        </Button>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento dei centri.</p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : centers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun centro trovato.</p>
      ) : (
        <div className="flex flex-col gap-3">
        <div className="w-full rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Città</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Indirizzo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stato</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.slice(page * pageSize, (page + 1) * pageSize).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-5 py-3">
                    <span className="text-sm font-semibold">{c.name}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm">{c.city}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{c.address}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{c.email}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    {c.isActive ? (
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
                        onClick={() => setEditCenter(c)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCenter(c)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          total={centers.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
        </div>
      )}

      {/* Dialog crea */}
      <CenterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Dialog modifica */}
      {editCenter && (
        <CenterDialog
          open={!!editCenter}
          onOpenChange={(v) => { if (!v) setEditCenter(null) }}
          center={editCenter}
        />
      )}

      {/* Confirm elimina */}
      <AlertDialog open={!!deleteCenter} onOpenChange={(v) => { if (!v) setDeleteCenter(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disattivare il centro?</AlertDialogTitle>
            <AlertDialogDescription>
              Il centro <strong>{deleteCenter?.name}</strong> verrà disattivato. L&apos;operazione
              non è possibile se esistono slot futuri attivi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCenter && deleteMutation.mutate(deleteCenter.id)}
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
