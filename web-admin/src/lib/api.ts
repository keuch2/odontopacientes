import axios from 'axios'

// Configurar base URL de la API - runtime detection
const _host = typeof window !== 'undefined' ? window.location.hostname : ''
const API_BASE_URL = _host === 'codexpy.com'
  ? window.location.protocol + '//codexpy.com/odontopacientes/api'
  : 'http://localhost/odontopacientes/backend/public/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage (donde Zustand lo persiste)
    const storedAuth = localStorage.getItem('odonto-auth')
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
    
    // Agregar timestamp para evitar caché
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('odonto-auth')
      window.location.reload()
    }
    
    return Promise.reject(error)
  }
)

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  data: T
  message?: string
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

// Funciones de utilidad para la API
export const api = {
  // Autenticación
  auth: {
    login: (email: string, password: string) =>
      apiClient.post<ApiResponse>('/auth/login', { email, password }),
    
    logout: () =>
      apiClient.post<ApiResponse>('/auth/logout'),
    
    me: () =>
      apiClient.get<ApiResponse>('/auth/me'),
    
    updateProfile: (data: { name: string; email: string; phone?: string }) =>
      apiClient.put<ApiResponse>('/auth/profile', data),
  },

  // Cátedras
  chairs: {
    getAll: (params?: { include_inactive?: boolean }) =>
      apiClient.get<ApiResponse>('/chairs', { params }),
    
    getById: (id: number) =>
      apiClient.get<ApiResponse>(`/chairs/${id}`),

    create: (data: any) =>
      apiClient.post<ApiResponse>('/chairs', data),

    update: (id: number, data: any) =>
      apiClient.put<ApiResponse>(`/chairs/${id}`, data),

    delete: (id: number) =>
      apiClient.delete<ApiResponse>(`/chairs/${id}`),
  },

  // Pacientes
  patients: {
    getAll: (params?: {
      q?: string
      chair_id?: number
      city?: string
      treatments?: number[]
      page?: number
      per_page?: number
    }) => apiClient.get<ApiResponse>('/patients', { params }),
    
    getById: (id: number) =>
      apiClient.get<ApiResponse>(`/patients/${id}`),
    
    create: (data: any) =>
      apiClient.post<ApiResponse>('/patients', data),
    
    update: (id: number, data: any) =>
      apiClient.put<ApiResponse>(`/patients/${id}`, data),
    
    delete: (id: number) =>
      apiClient.delete<ApiResponse>(`/patients/${id}`),
    
    getProcedures: (id: number) =>
      apiClient.get<ApiResponse>(`/patients/${id}/procedures`),
    
    getOdontograms: (id: number) =>
      apiClient.get<ApiResponse>(`/patients/${id}/odontograms`),
  },

  // Procedimientos
  procedures: {
    getAll: (params?: {
      chair_id?: number
      status?: string
      patient_id?: number
      page?: number
      per_page?: number
    }) => apiClient.get<ApiResponse>('/patient-procedures', { params }),
    
    getById: (id: number) =>
      apiClient.get<ApiResponse>(`/patient-procedures/${id}`),
    
    assign: (id: number) =>
      apiClient.post<ApiResponse>(`/patient-procedures/${id}/assign`),
    
    complete: (id: number, data?: { notes?: string; final_price?: number }) =>
      apiClient.post<ApiResponse>(`/patient-procedures/${id}/complete`, data),
    
    updateProgress: (id: number, data: { sessions_completed: number; notes?: string }) =>
      apiClient.put<ApiResponse>(`/patient-procedures/${id}/progress`, data),
  },

  // Estudiantes
  students: {
    getAll: () =>
      apiClient.get<ApiResponse>('/students'),
    
    getById: (id: number) =>
      apiClient.get<ApiResponse>(`/students/${id}`),
    
    getAssignments: (id: number) =>
      apiClient.get<ApiResponse>(`/students/${id}/assignments`),
    
    getMyAssignments: () =>
      apiClient.get<ApiResponse>('/my-assignments'),
    
    getMyHistory: () =>
      apiClient.get<ApiResponse>('/my-history'),
  },

  // Tratamientos
  treatments: {
    getAll: (params?: { chair_id?: number }) =>
      apiClient.get<ApiResponse>('/treatments', { params }),
    
    getByChair: (chairId: number) =>
      apiClient.get<ApiResponse>('/treatments', { params: { chair_id: chairId } }),

    create: (data: any) =>
      apiClient.post<ApiResponse>('/treatments', data),

    update: (id: number, data: any) =>
      apiClient.put<ApiResponse>(`/treatments/${id}`, data),

    delete: (id: number) =>
      apiClient.delete<ApiResponse>(`/treatments/${id}`),
  },

  // Sub-clases de tratamientos
  treatmentSubclasses: {
    getAll: (treatmentId: number) =>
      apiClient.get<ApiResponse>(`/treatments/${treatmentId}/subclasses`),

    create: (treatmentId: number, data: any) =>
      apiClient.post<ApiResponse>(`/treatments/${treatmentId}/subclasses`, data),

    update: (treatmentId: number, subclassId: number, data: any) =>
      apiClient.put<ApiResponse>(`/treatments/${treatmentId}/subclasses/${subclassId}`, data),

    delete: (treatmentId: number, subclassId: number) =>
      apiClient.delete<ApiResponse>(`/treatments/${treatmentId}/subclasses/${subclassId}`),
  },

  // Opciones de sub-clases (a nivel de tratamiento)
  subclassOptions: {
    getAll: (treatmentId: number) =>
      apiClient.get<ApiResponse>(`/treatments/${treatmentId}/options`),

    create: (treatmentId: number, data: any) =>
      apiClient.post<ApiResponse>(`/treatments/${treatmentId}/options`, data),

    update: (treatmentId: number, optionId: number, data: any) =>
      apiClient.put<ApiResponse>(`/treatments/${treatmentId}/options/${optionId}`, data),

    delete: (treatmentId: number, optionId: number) =>
      apiClient.delete<ApiResponse>(`/treatments/${treatmentId}/options/${optionId}`),
  },

  // Universidades
  universities: {
    getAll: () =>
      apiClient.get<ApiResponse>('/universities'),

    getById: (id: number) =>
      apiClient.get<ApiResponse>(`/universities/${id}`),

    create: (data: any) =>
      apiClient.post<ApiResponse>('/universities', data),

    update: (id: number, data: any) =>
      apiClient.put<ApiResponse>(`/universities/${id}`, data),

    delete: (id: number) =>
      apiClient.delete<ApiResponse>(`/universities/${id}`),
  },

  // Notificaciones
  notifications: {
    getAll: (params?: { page?: number; per_page?: number }) =>
      apiClient.get<ApiResponse>('/notifications', { params }),
    
    getUnreadCount: () =>
      apiClient.get<ApiResponse>('/notifications/unread-count'),
    
    markAsRead: (id: number) =>
      apiClient.put<ApiResponse>(`/notifications/${id}/read`),
    
    markAllAsRead: () =>
      apiClient.put<ApiResponse>('/notifications/mark-all-read'),
  },

  // Estadísticas
  stats: {
    getDashboard: () =>
      apiClient.get<ApiResponse>('/stats/dashboard'),
    
    getProceduresByChair: () =>
      apiClient.get<ApiResponse>('/stats/procedures-by-chair'),
    
    getStudentsPerformance: () =>
      apiClient.get<ApiResponse>('/stats/students-performance'),
  },

  // Búsqueda
  search: (query: string, type?: string) =>
    apiClient.get<ApiResponse>('/search', { 
      params: { q: query, type } 
    }),
}
