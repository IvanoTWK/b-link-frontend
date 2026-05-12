'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import { TablePaginator } from '@/components/ui/table-paginator'
import type { GdprRequest, GdprRequestStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

type StatusFilter = GdprRequestStatus | 'ALL'
const EMPTY_STATUS: StatusFilter = 'ALL'

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchGdprRequests(status: StatusFilter): Promise<GdprRequest[]> {
  const params: Record<string, string | number> = { limit: 100 }
  if (status && status !== 'ALL') params.status = status

  const { data } = await apiClient.get<PaginatedGdprRequests>('/gdpr/requests', { params })
  return data.items
}

// ── Badge stato ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return <Badge className="text-xs bg-yellow-500 text-white hover:bg-yellow-500">In attesa</Badge>
  if (status === 'COMPLETED') return <Badge variant="secondary" className="text-xs">Confermata</Badge>
  return <Badge variant="destructive" className="text-xs">Annullata</Badge>
}

// ── Dialog conferma ───────────────────────────────────────────────────────────

function ConfirmRevokeDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request: GdprRequest | null
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => apiClient.patch(`/gdpr/requests/${request!.id}/handle`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gdpr'] })
      toast.success('Consenso revocato.')
      onOpenChange(false)
    },
    onError: () => toast.error('Errore nella conferma della revoca.'),
  })

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conferma revoca consenso</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2 text-sm text-muted-foreground">
          <p>
            Stai confermando la revoca del consenso al trattamento dei dati personali
            per il donatore con ID <span className="font-mono text-foreground">{request.donorId.slice(0, 8)}…</span>
          </p>
          <p className="font-medium text-foreground">
            Il donatore non riceverà più comunicazioni relative all&apos;attività di donazione.
          </p>
          <p className="text-xs">
            Richiesta del {format(new Date(request.requestedAt), 'd MMM yyyy HH:mm', { locale: it })}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Elaborazione...' : 'Conferma revoca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminConsensiPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(EMPTY_STATUS)
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>(EMPTY_STATUS)
  const [confirmRequest, setConfirmRequest] = useState<GdprRequest | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data: allRequests = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'gdpr', appliedStatus],
    queryFn: () => fetchGdprRequests(appliedStatus),
  })

  const handleApplyFilters = useCallback(() => {
    setAppliedStatus(statusFilter)
    setPage(0)
  }, [statusFilter])

  const handleResetFilters = useCallback(() => {
    setStatusFilter(EMPTY_STATUS)
    setAppliedStatus(EMPTY_STATUS)
    setPage(0)
  }, [])

  const paged = allRequests.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Richieste di revoca consenso</h1>
        <p className="text-sm text-muted-foreground">
          Gestisci le richieste dei donatori di revocare il consenso al trattamento dei dati personali.
        </p>
      </div>

      {/* Filtro stato */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tutti gli stati</SelectItem>
            <SelectItem value="PENDING">In attesa</SelectItem>
            <SelectItem value="COMPLETED">Confermata</SelectItem>
            <SelectItem value="CANCELLED">Annullata</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" onClick={handleApplyFilters}>Filtra</Button>
        <Button size="sm" variant="outline" onClick={handleResetFilters}>Reset</Button>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento delle richieste.</p>
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
        <div className="flex flex-col gap-3">
          <div className="w-full rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stato</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Donatore</TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="pl-5 py-3 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(req.requestedAt), 'd MMM yyyy HH:mm', { locale: it })}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {req.donorId.slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      {req.status === 'PENDING' ? (
                        <Button size="sm" variant="outline" onClick={() => setConfirmRequest(req)}>
                          Conferma revoca
                        </Button>
                      ) : (
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

          <TablePaginator
            page={page}
            pageSize={pageSize}
            total={allRequests.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
          />
        </div>
      )}

      <ConfirmRevokeDialog
        open={!!confirmRequest}
        onOpenChange={(v) => { if (!v) setConfirmRequest(null) }}
        request={confirmRequest}
      />
    </div>
  )
}
