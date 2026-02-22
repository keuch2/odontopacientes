import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'coordinador' | 'admision' | 'alumno'
  faculty_id: number
  faculty: {
    id: number
    name: string
    university: {
      id: number
      name: string
      code: string
    }
  }
  phone?: string
  active: boolean
  student?: {
    id: number
    student_number: string
    year: number
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: { name: string; email: string; phone?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          })

          const { user, access_token } = response.data
          
          // Configurar token en el cliente API
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Error al iniciar sesión')
        }
      },

      logout: () => {
        // Limpiar token del cliente API
        delete apiClient.defaults.headers.common['Authorization']
        
        // Hacer llamada a logout si hay token
        const token = get().token
        if (token) {
          apiClient.post('/auth/logout').catch(() => {
            // Ignorar errores en logout
          })
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      checkAuth: async () => {
        const token = get().token
        
        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          set({ isLoading: true })
          
          // Configurar token en headers
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/auth/me')
          const { user } = response.data
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // Token inválido, limpiar estado
          delete apiClient.defaults.headers.common['Authorization']
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateProfile: async (data: { name: string; email: string; phone?: string }) => {
        try {
          const response = await apiClient.put('/auth/profile', data)
          const { user } = response.data
          
          set({ user })
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Error al actualizar perfil')
        }
      },
    }),
    {
      name: 'odonto-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
