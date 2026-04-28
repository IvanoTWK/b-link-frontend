'use client'

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDonorProfile } from "@/hooks/use-donor-profile"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { DonorsHeader } from "@/components/donors/layout/donors-header"
import { Spinner } from "@/components/ui/spinner"

export default function DonorsLayout({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const { isAuthenticated, isHydrated } = useAuthStore()
  const user = useAuthStore((s) => s.user)

  const { isLoading, hasNoProfile } = useDonorProfile({ enabled: isHydrated && isAuthenticated })

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady || !isHydrated) return

    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }

    if (user?.role !== 'DONOR') {
      router.replace('/')
      return
    }

    if (!isLoading && hasNoProfile && pathname !== '/donors/profile/setup') {
      router.replace('/donors/profile/setup')
    }
  }, [isReady, isHydrated, isAuthenticated, user, isLoading, hasNoProfile, pathname, router])

  if (!isReady || !isHydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!isHydrated || !isAuthenticated || user?.role !== 'DONOR') {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DonorsHeader />
        <main className="flex-1 min-h-0 overflow-auto p-6 flex flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )

}