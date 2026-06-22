import axios from 'axios'

// Base URL de la API — runtime detection (igual patrón que web-admin).
const _host = typeof window !== 'undefined' ? window.location.hostname : ''
const API_BASE_URL =
  _host === 'codexpy.com'
    ? window.location.protocol + '//codexpy.com/odontopacientes/api'
    : 'http://localhost/odontopacientes/backend/public/api'

// Clave de persistencia propia, distinta a la del web-admin ('odonto-auth')
// para que ambos sitios puedan convivir en el mismo dominio sin pisarse.
export const AUTH_STORAGE_KEY = 'odonto-public-auth'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedAuth) {
      try {
        const { state } = JSON.parse(storedAuth)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch (e) {
        console.error('Error parsing stored auth:', e)
      }
    }

    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() }
    }

    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      // No recargamos automáticamente: dejamos que el router redirija a login.
    }
    return Promise.reject(error)
  }
)

export interface ApiResponse<T = any> {
  data: T
  message?: string
}

export interface University {
  id: number
  name: string
}

// Datos de perfil que el sitio web edita (mismos campos que la app mobile).
export interface ProfilePayload {
  name: string
  phone?: string
  birth_date?: string | null
  city?: string | null
  institution?: string | null
  university_id?: number | null
  course?: string | null
  facebook?: string | null
  instagram?: string | null
  tiktok?: string | null
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone: string
  birth_date?: string | null
  university_id?: number | null
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<ApiResponse>('/auth/login', { email, password }),
    logout: () => apiClient.post<ApiResponse>('/auth/logout'),
    me: () => apiClient.get<ApiResponse>('/auth/me'),
    register: (payload: RegisterPayload) =>
      apiClient.post<ApiResponse>('/auth/register', payload),
    checkEmail: (email: string) =>
      apiClient.post<ApiResponse<{ exists: boolean }>>('/auth/check-email', { email }),
  },

  universities: {
    list: () => apiClient.get<ApiResponse<University[]>>('/universities'),
  },

  profile: {
    // Mismos endpoints que usa la app mobile.
    update: (payload: ProfilePayload) =>
      apiClient.put<ApiResponse>('/profile', payload),
    uploadImage: (imageBase64: string) =>
      apiClient.post<ApiResponse>('/profile/image', { image: imageBase64 }),
  },

  account: {
    // Eliminación de cuenta — idéntico contrato que la app (Apple 5.1.1).
    remove: (password: string) =>
      apiClient.delete<ApiResponse>('/account', {
        data: { password, confirm: 'ELIMINAR' },
      }),
  },

  subscription: {
    // Módulo de pago (Bancard). Funciona en modo stub mientras no haya
    // credenciales; el control de plan no depende de esto.
    plans: () =>
      apiClient.get<ApiResponse & { is_stub?: boolean }>('/subscriptions/plans'),
    checkout: (planCode: string) =>
      apiClient.post<ApiResponse>('/subscriptions/checkout', { plan_code: planCode }),
    status: (processId: string) =>
      apiClient.get<ApiResponse>(`/subscriptions/${processId}/status`),
  },
}
