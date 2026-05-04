'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, Mail, ShieldCheck, ShieldOff, UserRound } from 'lucide-react'

import type { AdminUser } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface UserDetailCardProps {
  user: AdminUser
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Guest',
  DONOR: 'Donatore',
  OPERATOR: 'Operatore',
  DOCTOR: 'Medico',
  ADMIN: 'Admin',
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-muted rounded-lg p-2.5 shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export function UserDetailCard({ user }: UserDetailCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Dati utente</p>
            <p className="text-xs text-muted-foreground">Informazioni in sola lettura</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow
            icon={<UserRound className="h-5 w-5 text-muted-foreground" />}
            label="Nome"
            value={user.name}
          />
          <InfoRow
            icon={<Mail className="h-5 w-5 text-muted-foreground" />}
            label="Email"
            value={
              <span className="flex items-center gap-2">
                {user.email}
                {!user.emailVerified && (
                  <Badge variant="secondary" className="text-xs">non verificata</Badge>
                )}
              </span>
            }
          />
          <InfoRow
            icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
            label="Ruolo"
            value={ROLE_LABEL[user.role] ?? user.role}
          />
          <InfoRow
            icon={<ShieldCheck className="h-5 w-5 text-muted-foreground" />}
            label="2FA"
            value={user.twoFactorEnabled ? 'Attivo' : 'Non attivo'}
          />
          <InfoRow
            icon={user.lockedAt ? (
              <ShieldOff className="h-5 w-5 text-destructive" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            )}
            label="Stato account"
            value={
              user.lockedAt ? (
                <Badge variant="destructive" className="text-xs">Bloccato</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Attivo</Badge>
              )
            }
          />
          <InfoRow
            icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
            label="Registrato il"
            value={format(new Date(user.createdAt), 'd MMMM yyyy', { locale: it })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
