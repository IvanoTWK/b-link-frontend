'use client'

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/axios";
import { useAuthStore } from "@/lib/store/auth.store";

export function useLogout(): { logout: () => Promise<void>; isLoggingOut: boolean } {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isLoggingOutRef = useRef(false)
  const router = useRouter()

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true
    setIsLoggingOut(true)
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // il logout avviene comunque nel finally
    } finally {
      useAuthStore.getState().logout()
      router.push('/auth/login')
      isLoggingOutRef.current = false
      setIsLoggingOut(false)
    }
  }, [router])

  return { logout, isLoggingOut }
}