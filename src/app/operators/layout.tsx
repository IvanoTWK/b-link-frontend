'use client'

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { OperatorSidebar } from "@/components/operators/layout/operator-sidebar"
import { OperatorHeader } from "@/components/operators/layout/operator-header"
import { Spinner } from "@/components/ui/spinner"

export default function OperatorsLayout({ children }: { children: ReactNode }) {
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

    if (user?.role !== 'OPERATOR') {
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

  if (!isAuthenticated || user?.role !== 'OPERATOR') {
    return null
  }

  return (
    <SidebarProvider>
      <OperatorSidebar />
      <SidebarInset>
        <OperatorHeader />
        <main className="flex-1 min-h-0 overflow-auto p-6 flex flex-col">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
