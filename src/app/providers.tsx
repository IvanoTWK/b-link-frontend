'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/auth.store";
import type { AuthMeResponse } from "@/lib/types";

// Istanza senza response interceptor — usata solo per la reidratazione iniziale.
// Non triggera mai window.location.href su fallimento, evitando il loop infinito
// sulla pagina di login quando l'utente non è autenticato.
const silentClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

function AuthInitializer() {
  const { setAccessToken, setUser, setHydrated } = useAuthStore()

  useEffect(() => {
    async function hydrate() {
      try {
        const { data } = await silentClient.post<{ accessToken: string }>('auth/refresh')
        setAccessToken(data.accessToken)
        try {
          const { data: me } = await silentClient.get<AuthMeResponse>('auth/me', {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          })
          setUser(me)
        } catch { }
      } catch {
      } finally {
        setHydrated()
      }
    }
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          retry: 1,
        }
      }
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
    </QueryClientProvider>
  )
}
