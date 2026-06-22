import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient, AUTH_STORAGE_KEY } from '@/lib/api'

export interface User {
  id: number
  name: string
  email: string
  role: string
  plan?: 'basico' | 'premium'
  is_premium?: boolean
  plan_expires_at?: string | null
  phone?: string
  birth_date?: string | null
  city?: string | null
  institution?: string | null
  course?: string | null
  university_id?: number | null
  facebook?: string | null
  instagram?: string | null
  tiktok?: string | null
  profile_image?: string | null
  faculty?: {
    id: number
    name: string
    university?: { id: number; name: string; code?: string }
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setUser: (user: User) => void
  /** Refresca el usuario desde /auth/me (tras editar perfil o cambiar plan). */
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        try {
          set({ isLoading: true })
          const response = await apiClient.post('/auth/login', {
            email: String(email).trim().toLowerCase(),
            password: String(password).trim(),
          })
          const { user, access_token } = response.data
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          set({ user, token: access_token, isAuthenticated: true, isLoading: false })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Error al iniciar sesión')
        }
      },

      logout: () => {
        const token = get().token
        if (token) {
          apiClient.post('/auth/logout').catch(() => {})
        }
        delete apiClient.defaults.headers.common['Authorization']
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },

      setUser: (user) => set({ user }),

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isLoading: false })
          return
        }
        try {
          set({ isLoading: true })
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await apiClient.get('/auth/me')
          set({ user: response.data.user, isAuthenticated: true, isLoading: false })
        } catch {
          delete apiClient.defaults.headers.common['Authorization']
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      refreshUser: async () => {
        try {
          const response = await apiClient.get('/auth/me')
          set({ user: response.data.user })
        } catch {
          // Silencioso: si falla, mantenemos el usuario actual.
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
