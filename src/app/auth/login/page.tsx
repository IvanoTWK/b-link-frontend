'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth.store'
import { ROLE_REDIRECT } from '@/lib/auth/constants'
import { LoginForm } from '@/components/auth/LoginForm'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isHydrated, user } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    if (isAuthenticated && user?.role) {
      router.replace(ROLE_REDIRECT[user.role])
    }
  }, [isHydrated, isAuthenticated, user, router])

  if (!isHydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <LoginForm />
  )
}
