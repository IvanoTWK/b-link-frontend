'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import { formatBloodGroup } from '@/lib/utils/blood-group'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TablePaginator } from '@/components/ui/table-paginator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface DonorSearchResult {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  bloodGroup: string
  completedDonationsCount: number
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function searchDonors(q: string): Promise<DonorSearchResult[]> {
  const { data } = await apiClient.get<DonorSearchResult[]>('/medical/donors', {
    params: q ? { q } : {},
  })
  return data
}

// ── Pagina ─────────────────────────────────────────────────────────────────────

export default function DoctorDonorsPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const { data: donors = [], isLoading, isError } = useQuery({
    queryKey: ['doctor', 'donors', query],
    queryFn: () => searchDonors(query),
  })

  const handleSearch = useCallback(() => {
    setQuery(search.trim())
  }, [search])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch],
  )

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Donatori</h1>
        <p className="text-sm text-muted-foreground">
          Cerca i donatori del tuo centro per nome o cognome.
        </p>
      </div>

      {/* Barra di ricerca */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome o cognome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          Cerca
        </Button>
      </div>

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">
          Errore nel caricamento dei donatori.
        </p>
      )}

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : donors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query
            ? 'Nessun donatore trovato per la ricerca effettuata.'
            : 'Nessun donatore nel tuo centro.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead className="hidden sm:table-cell">Gruppo sanguigno</TableHead>
                <TableHead className="hidden md:table-cell text-right">Donazioni completate</TableHead>
                <TableHead className="text-right">Scheda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donors.slice(page * pageSize, (page + 1) * pageSize).map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium">{donor.firstName}</TableCell>
                  <TableCell>{donor.lastName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatBloodGroup(donor.bloodGroup)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                    {donor.completedDonationsCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/doctors/donors/${donor.userId}`}>
                        Apri scheda
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePaginator
          page={page}
          pageSize={pageSize}
          total={donors.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
        />
        </div>
      )}
    </div>
  )
}
