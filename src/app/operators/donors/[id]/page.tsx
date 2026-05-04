'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Mail, Phone, User } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { DonorBasicProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchDonorBasicProfile(id: string): Promise<DonorBasicProfile> {
  const { data } = await apiClient.get<DonorBasicProfile>(`/donors/${id}/basic-profile`)
  return data
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-muted rounded-lg p-2.5 shrink-0">{icon}</div>
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold">{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function OperatorDonorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: donor, isLoading, isError } = useQuery({
    queryKey: ['operator', 'donor-basic', id],
    queryFn: () => fetchDonorBasicProfile(id),
  })

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !donor) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">Donatore non trovato.</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Torna indietro
        </Button>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {donor.firstName} {donor.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">Profilo donatore</p>
        </div>
      </div>

      {/* Card anagrafica */}
      <Card className="border-border">
        <CardContent className="p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Dati anagrafici</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow
              icon={<User className="h-5 w-5 text-muted-foreground" />}
              label="Nome"
              value={donor.firstName}
            />
            <InfoRow
              icon={<User className="h-5 w-5 text-muted-foreground" />}
              label="Cognome"
              value={donor.lastName}
            />
            <InfoRow
              icon={<Mail className="h-5 w-5 text-muted-foreground" />}
              label="Email"
              value={donor.email}
            />
            <InfoRow
              icon={<Phone className="h-5 w-5 text-muted-foreground" />}
              label="Telefono"
              value={donor.phone}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
