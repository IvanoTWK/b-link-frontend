import { create } from "zustand"
import type { AuthMeResponse } from "../types"

interface AuthState {
  accessToken: string | null
  user: AuthMeResponse | null
  isAuthenticated: boolean
  setAccessToken: (token: string | null) => void
  setUser: (user: AuthMeResponse | null) => void
  login: (accessToken: string, user: AuthMeResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: token !== null && token !== "" }),
  setUser: (user) => set({ user }),
  login: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),
  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}))

