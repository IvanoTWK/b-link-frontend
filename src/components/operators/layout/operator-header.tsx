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
  operators: "Operators",
  bookings: "Prenotazioni",
  slots: "Slot",
  donors: "Donatori",
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

export function OperatorHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const visibleSegments = segments.slice(1)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {visibleSegments.map((segment, i) => {
            const originalIndex = i + 1
            const isLast = originalIndex === segments.length - 1
            const label = translateSegment(segment)
            const href = "/" + segments.slice(0, originalIndex + 1).join("/")

            return (
              <React.Fragment key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
