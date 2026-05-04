'use client'

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DoctorSidebar } from "@/components/doctors/layout/doctor-sidebar"
import { DoctorHeader } from "@/components/doctors/layout/doctor-header"
import { Spinner } from "@/components/ui/spinner"

export default function DoctorsLayout({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()

  const { isAuthenticated, isHydrated } = useAuthStore()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady || !isHydrated) return

    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }

    if (user?.role !== 'DOCTOR') {
      router.replace('/')
      return
    }
  }, [isReady, isHydrated, isAuthenticated, user, router])

  if (!isReady || !isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return null
  }

  return (
    <SidebarProvider>
      <DoctorSidebar />
      <SidebarInset>
        <DoctorHeader />
        <main className="flex-1 min-h-0 overflow-auto p-6 flex flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
