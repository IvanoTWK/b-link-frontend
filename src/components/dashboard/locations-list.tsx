'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

import type { Center } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'

interface LocationsListProps {
  centers: Center[]
  selected: Center | null
  onSelect: (center: Center) => void
}

function hasCoordinates(center: Center) {
  return center.latitude != null && center.longitude != null
}

export function LocationsList({ centers, selected, onSelect }: LocationsListProps) {
  return (
    <div className="flex min-h-0 flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-background">
      {centers.map((center) => {
        const isSelected = selected?.id === center.id

        return (
          <button
            key={center.id}
            type="button"
            onClick={() => onSelect(center)}
            className={cn(
              'grid gap-3 p-4 text-left transition-colors hover:bg-muted/50',
              isSelected && 'bg-muted'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{center.name}</p>
                <p className="text-xs text-muted-foreground">{center.city}</p>
              </div>
              {hasCoordinates(center) && (
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
            </div>

            <div className="grid gap-2 text-xs text-muted-foreground">
              <span className="leading-snug">{center.address}</span>
              <span className="inline-flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                {center.phone}
              </span>
              <span className="inline-flex min-w-0 items-center gap-2">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{center.email}</span>
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function LocationsListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 rounded-md border border-border bg-muted/40" />
      ))}
    </div>
  )
}

export function BookLocationButton() {
  return (
    <Button asChild>
      <Link href="/donors/bookings/new">Prenota donazione</Link>
    </Button>
  )
}
