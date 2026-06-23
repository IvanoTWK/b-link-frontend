'use client'

import { Mail, MapPin, Phone } from 'lucide-react'

import type { Center } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface LocationsSelectorProps {
  centers: Center[]
  selected: Center | null
  onSelect: (center: Center) => void
}

function hasCoordinates(center: Center) {
  return center.latitude != null && center.longitude != null
}

export function LocationsSelector({ centers, selected, onSelect }: LocationsSelectorProps) {
  const selectedCenter = selected ?? centers[0] ?? null
  const selectedValue = selectedCenter?.id ?? ''

  return (
    <div className="grid gap-3">
      <Select
        value={selectedValue}
        onValueChange={(id) => {
          const center = centers.find((item) => item.id === id)
          if (center) onSelect(center)
        }}
      >
        <SelectTrigger className="h-11 w-full sm:max-w-md">
          <SelectValue placeholder="Seleziona una sede" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {centers.map((center) => (
            <SelectItem key={center.id} value={center.id}>
              {center.name} - {center.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCenter && (
        <div className="grid gap-2 rounded-md border border-border bg-background p-4 text-sm sm:max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{selectedCenter.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCenter.address}, {selectedCenter.city}</p>
            </div>
            {hasCoordinates(selectedCenter) && (
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:gap-5">
            <span className="inline-flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              {selectedCenter.phone}
            </span>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{selectedCenter.email}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function LocationsSelectorSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-11 w-full sm:max-w-md" />
      <Skeleton className="h-28 w-full sm:max-w-2xl" />
    </div>
  )
}
