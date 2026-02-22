import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../lib/api'

interface User {
  id: number
  name: string
  email: string
  role: string
  phone?: string
  profile_image?: string
  faculty?: {
    id: number
    name: string
    university?: {
      id: number
      name: string
    }
  }
  student?: {
    id: number
    student_number: string
    year: number
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const normalizedEmail = String(email ?? '').trim().toLowerCase()
          const normalizedPassword = String(password ?? '').trim()

          const response = await api.auth.login({ email: normalizedEmail, password: normalizedPassword })
          const { user, access_token } = response.data

          // Configurar token en el cliente API
          api.setAuthToken(access_token)

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('Error en login:', error)
          throw error
        }
      },

      logout: () => {
        api.auth.logout().catch(() => {
          // Ignorar errores de logout - el token ya puede estar invalidado
        })
        api.setAuthToken(null)
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      checkAuth: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          // Configurar token en el cliente API
          api.setAuthToken(token)
          
          // Verificar que el token siga siendo válido
          const response = await api.auth.me()
          
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('Token inválido:', error)
          // Token inválido, limpiar estado
          api.setAuthToken(null)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
