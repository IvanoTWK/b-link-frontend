'use client'

import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

import type { AdminUser } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface UsersTableProps {
  users: AdminUser[]
  isLoading: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Guest',
  DONOR: 'Donatore',
  OPERATOR: 'Operatore',
  DOCTOR: 'Medico',
  ADMIN: 'Admin',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!users.length) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia className="border p-2 bg-muted rounded-sm">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="text-md">Nessun utente</EmptyTitle>
            <EmptyDescription className="text-sm text-muted-foreground">
              Nessun utente trovato per i filtri selezionati.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nome
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ruolo
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Stato
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Registrato il
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/users/${user.id}`)}
            >
              <TableCell className="pl-5 py-3">
                <span className="text-sm font-semibold">{user.name}</span>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm">{user.email}</span>
                {!user.emailVerified && (
                  <span className="ml-2 text-xs text-muted-foreground">(non verificata)</span>
                )}
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm">{ROLE_LABEL[user.role] ?? user.role}</span>
              </TableCell>
              <TableCell className="py-3">
                {user.lockedAt ? (
                  <Badge variant="destructive" className="text-xs">Bloccato</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Attivo</Badge>
                )}
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(user.createdAt), 'd MMM yyyy', { locale: it })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
