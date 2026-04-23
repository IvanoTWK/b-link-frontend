'use client'

import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { apiClient } from '@/lib/api/axios'
import type { DonorProfile } from '@/lib/types'

async function fetchDonorProfile(): Promise<DonorProfile | null> {
  try {
    const { data } = await apiClient.get<DonorProfile>('/donors/profile')
    return data
  } catch (error) {
    // 404 il profilo non esiste ancora, ok 
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    // qualsiasi altro errore non è normale -> lo rilanciamo 
    throw error
  }
}

export function useDonorProfile(options?: { enabled?: boolean }) {
  const { data, isLoading, isError, refetch } = useQuery<DonorProfile | null>({
    queryKey: ['donor', 'profile'],
    queryFn: fetchDonorProfile,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })

  return {
    profile: data ?? null,
    isLoading,
    isError,
    // true se la query è andata a buon fine ma il profilo non esiste ancora
    hasNoProfile: !isLoading && !isError && data === null,
    refetch,
  }
}