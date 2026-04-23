"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS: Record<string, string> = {
  donors: "Donors",
  profile: "Profilo",
  setup: "Configurazione",
  bookings: "Prenotazioni",
  new: "Nuova",
  anamnesis: "Anamnesi",
  donations: "Donazioni",
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NUMERIC_REGEX = /^\d+$/

function isDynamicSegment(segment: string): boolean {
  return UUID_REGEX.test(segment) || NUMERIC_REGEX.test(segment)
}

function translateSegment(segment: string): string {
  if (isDynamicSegment(segment)) return "Dettaglio"
  return SEGMENT_LABELS[segment] ?? segment
}

export function DonorsHeader() {
  const pathname = usePathname()

  const allSegments = pathname.split("/").filter(Boolean)
  // Escludi il segmento radice della sezione (es. "donors")
  const segments = allSegments.slice(1)

  const crumbs = segments.map((segment, index) => {
    const href = "/" + allSegments.slice(0, index + 2).join("/")
    const label = translateSegment(segment)
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-full" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
