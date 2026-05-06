'use client'

import { useState, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

import { apiClient } from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TablePaginator } from '@/components/ui/table-paginator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string
  staffId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  ipAddress: string | null
  userAgent: string | null
  metadata: unknown
  createdAt: string
}

interface PaginatedAuditLogs {
  items: AuditLog[]
  nextCursor: string | null
}

interface AuditLogFilters {
  action: string
  actorId: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: AuditLogFilters = {
  action: '',
  actorId: '',
  dateFrom: '',
  dateTo: '',
}

const PAGE_LIMIT = 20

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchAuditLogs(
  filters: AuditLogFilters,
  cursor: string | null,
): Promise<PaginatedAuditLogs> {
  const params: Record<string, string | number> = { limit: PAGE_LIMIT }
  if (filters.action) params.action = filters.action
  if (filters.actorId) params.actorId = filters.actorId
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (cursor) params.cursor = cursor

  const { data } = await apiClient.get<PaginatedAuditLogs>('/audit-logs', { params })
  return data
}

// ── Colore badge azione ───────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
  if (action.includes('LOGIN') || action.includes('AUTH')) variant = 'default'
  if (action.includes('DELETE') || action.includes('LOCK') || action.includes('GDPR'))
    variant = 'destructive'
  if (action.includes('BOOKING')) variant = 'outline'

  return (
    <Badge variant={variant} className="text-xs font-mono">
      {action}
    </Badge>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['admin', 'audit-logs', appliedFilters],
      queryFn: ({ pageParam }) =>
        fetchAuditLogs(appliedFilters, pageParam as string | null),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    })

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ ...filters })
    setPage(0)
  }, [filters])

  const handleResetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(0)
  }, [])

  const allLogs = data?.pages.flatMap((p) => p.items) ?? []
  const paged = allLogs.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Traccia delle azioni sensibili eseguite sulla piattaforma.
        </p>
      </div>

      {/* Filtri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Azione (es. AUTH_LOGIN)"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
        />
        <Input
          placeholder="ID attore (UUID)"
          value={filters.actorId}
          onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value }))}
        />
        <Input
          type="date"
          placeholder="Da"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
        />
        <Input
          type="date"
          placeholder="A"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleApplyFilters}>Filtra</Button>
        <Button size="sm" variant="outline" onClick={handleResetFilters}>Reset</Button>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento degli audit log.</p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : allLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun log trovato.</p>
      ) : (
        <div className="w-full rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Azione</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attore</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entità</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IP</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="pl-5 py-3 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'd MMM yyyy HH:mm', { locale: it })}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {log.staffId ? log.staffId.slice(0, 8) + '...' : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {log.entityType ? (
                      <span className="text-xs text-muted-foreground">
                        {log.entityType}
                        {log.entityId ? ` (${log.entityId.slice(0, 6)}...)` : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {log.ipAddress ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 max-w-xs">
                    <span className="text-xs text-muted-foreground line-clamp-1 font-mono">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginazione */}
      {!isLoading && allLogs.length > 0 && (
        <TablePaginator
          page={page}
          pageSize={pageSize}
          total={allLogs.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
      )}

      {/* Carica altri dal server */}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Caricamento...' : 'Carica altri log'}
          </Button>
        </div>
      )}
    </div>
  )
}
