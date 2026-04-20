import axios from "axios";
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from "../store/auth.store";

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Istanza separata per il refresh - senza interceptor per evitare loop
const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

// Client principale
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // per inviare il cookie refresh token
})

// Request interceptor - Aggiunge <Authorization: Bearer> alle richieste
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


// Response interceptor - Gestisce il refresh token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(token!)
    }
  })
  failedQueue = []
}


apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest

    // Se non è 401 o stiamo già refreshando, blocca
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Evita doppi refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient.request(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await refreshClient.post<{ accessToken: string }>('auth/refresh')
      useAuthStore.getState().setAccessToken(data.accessToken)
      processQueue(null, data.accessToken)
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient.request(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().setAccessToken(null)
      window.location.href = '/auth/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)