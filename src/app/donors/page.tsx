'use client'

import Link from 'next/link'
import { CalendarDays, Droplets, User } from 'lucide-react'
import { useDonorProfile } from '@/hooks/use-donor-profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { BloodGroup } from '@/lib/types'

function formatBloodGroup(bg: BloodGroup): string {
  const map: Record<BloodGroup, string> = {
    A_POSITIVE: 'A+',
    A_NEGATIVE: 'A-',
    B_POSITIVE: 'B+',
    B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+',
    AB_NEGATIVE: 'AB-',
    O_POSITIVE: '0+',
    O_NEGATIVE: '0-',
    UNKNOWN: '—',
  }
  return map[bg] ?? '—'
}

export default function DonorsPage() {
  const { profile, isLoading } = useDonorProfile()

  return (
    <div className="space-y-6">
      {/* Sezione benvenuto */}
      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-semibold">
            Bentornato, {profile?.firstName}!
          </h1>
        )}
      </div>

      {/* Griglia card */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card: Prossima prenotazione */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Prossima prenotazione</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nessuna prenotazione in programma
            </p>
            <Button asChild size="sm">
              <Link href="/donors/bookings/new">Prenota ora</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card: Donazioni effettuate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Donazioni effettuate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
            <p className="text-sm text-muted-foreground">Totale donazioni</p>
          </CardContent>
        </Card>

        {/* Card: Il tuo profilo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Il tuo profilo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">
                {profile?.bloodGroup
                  ? formatBloodGroup(profile.bloodGroup)
                  : '—'}
              </p>
            )}
            <Link
              href="/donors/profile"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Visualizza profilo
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
