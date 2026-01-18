import axios, { AxiosInstance, AxiosResponse } from 'axios'
import Constants from 'expo-constants'

// Configuración de la API
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost/odontopacientes/backend/public/api'

// Debug: Log de la URL configurada
console.log('🔧 API Configuration:', {
  apiUrl: API_BASE_URL,
  expoConfig: Constants.expoConfig?.extra,
  manifest: Constants.manifest
})

// Interfaces
interface LoginCredentials {
  email: string
  password: string
}

interface ApiResponse<T = any> {
  data: T
  message?: string
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

interface AuthLoginResponse {
  message: string
  user: User
  access_token: string
  token_type: string
}

interface AuthRegisterResponse {
  message: string
  user: User
  access_token: string
  token_type: string
}

interface AuthMeResponse {
  user: User
}

interface AuthCheckEmailResponse {
  exists: boolean
}

interface User {
  id: number
  name: string
  email: string
  role: string
  faculty?: any
  student?: any
}

interface Patient {
  id: number
  full_name: string
  age: number
  gender: string
  city: string
  phone: string
  document: string
}

interface Chair {
  id: number
  name: string
  key: string
  color: string
  treatments?: any[]
}

// Cliente HTTP configurado
class ApiClient {
  private client: AxiosInstance
  private authToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    })

    // Interceptor para requests
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Interceptor para responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.setAuthToken(null)
          // Aquí podrías disparar un evento para forzar logout
        }
        return Promise.reject(error)
      }
    )
  }

  setAuthToken(token: string | null) {
    this.authToken = token
  }

  // Métodos de autenticación
  auth = {
    login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthLoginResponse>> =>
      this.client.post('/auth/login', credentials),

    checkEmail: (email: string): Promise<AxiosResponse<AuthCheckEmailResponse>> =>
      this.client.post('/auth/check-email', { email }, { timeout: 2000 }),

    register: (data: {
      name: string
      email: string
      password: string
      phone: string
      birth_date?: string
      course?: string
      faculty?: string
    }): Promise<AxiosResponse<AuthRegisterResponse>> =>
      this.client.post('/auth/register', data),

    logout: (): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post('/auth/logout'),

    me: (): Promise<AxiosResponse<AuthMeResponse>> =>
      this.client.get('/auth/me'),
  }

  // Métodos de cátedras
  chairs = {
    list: (params?: { active?: boolean }): Promise<AxiosResponse<ApiResponse<Chair[]>>> =>
      this.client.get('/chairs', { params }),

    get: (id: number): Promise<AxiosResponse<ApiResponse<Chair>>> =>
      this.client.get(`/chairs/${id}`),
  }

  // Métodos de pacientes
  patients = {
    search: (params?: {
      q?: string
      chair_id?: number
      city?: string
      treatments?: number[]
      page?: number
      per_page?: number
    }): Promise<AxiosResponse<PaginatedResponse<Patient>>> =>
      this.client.get('/patients', { params }),

    get: (id: number): Promise<AxiosResponse<ApiResponse<Patient>>> =>
      this.client.get(`/patients/${id}`),

    create: (patientData: any): Promise<AxiosResponse<ApiResponse<Patient>>> =>
      this.client.post('/patients', patientData),

    update: (id: number, patientData: any): Promise<AxiosResponse<ApiResponse<Patient>>> =>
      this.client.put(`/patients/${id}`, patientData),
  }

  // Métodos de procedimientos
  procedures = {
    create: (data: { patient_id: number, treatment_id: number, chair_id: number, description?: string }): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post('/patient-procedures', data),

    assign: (procedureId: number): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/patient-procedures/${procedureId}/assign`),

    complete: (procedureId: number, data?: { notes?: string, final_price?: number }): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/patient-procedures/${procedureId}/complete`, data),
  }

  // Métodos para estudiantes
  students = {
    getMyAssignments: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/my-assignments'),
    
    getAssignmentDetail: (id: number): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.get(`/my-assignments/${id}`),
    
    completeAssignment: (id: number, data: { final_notes?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.post(`/my-assignments/${id}/complete`, data),
    
    abandonAssignment: (id: number, data: { reason: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.post(`/my-assignments/${id}/abandon`, data),
  }

  // Métodos de estadísticas
  stats = {
    getDashboard: (): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.get('/stats/dashboard'),

    getProceduresByChair: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/stats/procedures-by-chair'),
  }

  // Métodos de notificaciones
  notifications = {
    list: (params?: { page?: number, per_page?: number }): Promise<AxiosResponse<PaginatedResponse<any>>> =>
      this.client.get('/notifications', { params }),

    markAsRead: (id: number): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/notifications/${id}/read`),

    getRecentActivity: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/recent-activity'),
  }

  // Métodos de fotos
  photos = {
    upload: (assignmentId: number, formData: FormData): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/assignments/${assignmentId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),

    delete: (assignmentId: number, photoId: number): Promise<AxiosResponse<ApiResponse>> =>
      this.client.delete(`/assignments/${assignmentId}/photos/${photoId}`),
  }
}

export const api = new ApiClient()
export type { User, Patient, Chair, ApiResponse, PaginatedResponse }
