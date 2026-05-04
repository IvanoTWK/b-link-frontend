'use client'

import { useState, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import type { GdprRequest, GdprRequestStatus, GdprRequestType } from '@/lib/types'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedGdprRequests {
  items: GdprRequest[]
  nextCursor: string | null
}

interface GdprFilters {
  status: GdprRequestStatus | ''
  type: GdprRequestType | ''
}

const EMPTY_FILTERS: GdprFilters = { status: '', type: '' }
const PAGE_LIMIT = 20

// ── Schema handle ─────────────────────────────────────────────────────────────

const handleSchema = z.object({
  notes: z.string().max(1000).optional(),
})

type HandleFormValues = z.infer<typeof handleSchema>

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchGdprRequests(
  filters: GdprFilters,
  cursor: string | null,
): Promise<PaginatedGdprRequests> {
  const params: Record<string, string | number> = { limit: PAGE_LIMIT }
  if (filters.status) params.status = filters.status
  if (filters.type) params.type = filters.type
  if (cursor) params.cursor = cursor

  const { data } = await apiClient.get<PaginatedGdprRequests>('/gdpr/requests', { params })
  return data
}

// ── Badge tipo/stato ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    EXPORT: 'Esportazione',
    DELETION: 'Cancellazione',
    RECTIFICATION: 'Rettifica',
  }
  return (
    <Badge variant="outline" className="text-xs">
      {map[type] ?? type}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return <Badge className="text-xs bg-yellow-500 text-white hover:bg-yellow-500">In attesa</Badge>
  if (status === 'COMPLETED') return <Badge variant="secondary" className="text-xs">Completata</Badge>
  return <Badge variant="destructive" className="text-xs">Annullata</Badge>
}

// ── Dialog gestisci richiesta ─────────────────────────────────────────────────

function HandleRequestDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request: GdprRequest | null
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HandleFormValues>({
    resolver: zodResolver(handleSchema),
    defaultValues: { notes: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: HandleFormValues) =>
      apiClient.patch(`/gdpr/requests/${request!.id}/handle`, values),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gdpr'] })
      toast.success('Richiesta GDPR gestita.')

      const result = res.data as GdprRequest & { exportData?: unknown }
      if (result.exportData) {
        toast.info('I dati di esportazione sono disponibili nella risposta.')
      }

      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast.error('Errore nella gestione della richiesta.')
    },
  })

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestisci richiesta GDPR</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2">
            <TypeBadge type={request.type} />
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Richiesta del{' '}
            {format(new Date(request.requestedAt), 'd MMM yyyy HH:mm', { locale: it })}
          </p>
          {request.notes && (
            <p className="text-sm">
              <span className="font-medium">Note donatore:</span> {request.notes}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="gdpr-notes">Note (opzionale)</FieldLabel>
              <Input
                id="gdpr-notes"
                placeholder="Note interne sulla gestione..."
                aria-invalid={!!errors.notes}
                {...register('notes')}
              />
              <FieldError errors={[errors.notes]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending ? 'Elaborazione...' : 'Segna come gestita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminGdprPage() {
  const [filters, setFilters] = useState<GdprFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<GdprFilters>(EMPTY_FILTERS)
  const [handleRequest, setHandleRequest] = useState<GdprRequest | null>(null)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin', 'gdpr', appliedFilters],
      queryFn: ({ pageParam }) =>
        fetchGdprRequests(appliedFilters, pageParam as string | null),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...filters })
  }, [filters])

  const handleResetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }, [])

  const allRequests = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Richieste GDPR</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci le richieste di esportazione, cancellazione e rettifica dati.
        </p>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, status: v as GdprRequestStatus | '' }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tutti gli stati</SelectItem>
            <SelectItem value="PENDING">In attesa</SelectItem>
            <SelectItem value="COMPLETED">Completata</SelectItem>
            <SelectItem value="CANCELLED">Annullata</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, type: v as GdprRequestType | '' }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tutti i tipi</SelectItem>
            <SelectItem value="EXPORT">Esportazione</SelectItem>
            <SelectItem value="DELETION">Cancellazione</SelectItem>
            <SelectItem value="RECTIFICATION">Rettifica</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" onClick={handleApplyFilters}>Filtra</Button>
        <Button size="sm" variant="outline" onClick={handleResetFilters}>Reset</Button>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento delle richieste GDPR.</p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : allRequests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna richiesta trovata.</p>
      ) : (
        <div className="w-full rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stato</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Donatore</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Note</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="pl-5 py-3 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(req.requestedAt), 'd MMM yyyy HH:mm', { locale: it })}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <TypeBadge type={req.type} />
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {req.donorId.slice(0, 8)}...
                    </span>
                  </TableCell>
                  <TableCell className="py-3 max-w-xs">
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {req.notes ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {req.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHandleRequest(req)}
                      >
                        Gestisci
                      </Button>
                    )}
                    {req.status !== 'PENDING' && (
                      <span className="text-xs text-muted-foreground">
                        {req.handledAt
                          ? format(new Date(req.handledAt), 'd MMM yyyy', { locale: it })
                          : '—'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Carica altri */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Caricamento...' : 'Carica altri'}
          </Button>
        </div>
      )}

      {/* Dialog gestisci */}
      <HandleRequestDialog
        open={!!handleRequest}
        onOpenChange={(v) => { if (!v) setHandleRequest(null) }}
        request={handleRequest}
      />
    </div>
  )
}
