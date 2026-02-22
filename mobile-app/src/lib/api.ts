import axios, { AxiosInstance, AxiosResponse } from 'axios'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Configuración de la API con detección automática de plataforma
const getApiBaseUrl = () => {
  // Si hay configuración en expo, usarla
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl
  }
  
  // Producción
  return 'https://codexpy.com/odontopacientes/api'
}

const API_BASE_URL = getApiBaseUrl()

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
      async (config) => {
        // Intentar obtener el token de AsyncStorage primero
        const token = await AsyncStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        } else if (this.authToken) {
          // Fallback al token en memoria
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
    if (token) {
      AsyncStorage.setItem('auth_token', token)
    } else {
      AsyncStorage.removeItem('auth_token')
    }
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

  // Métodos de tratamientos
  treatments = {
    list: (params?: { chair_id?: number }): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/treatments', { params }),

    get: (id: number): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.get(`/treatments/${id}`),
  }

  // Métodos de pacientes
  patients = {
    search: (params?: {
      q?: string
      chair_id?: number
      city?: string
      treatments?: number[]
      tooth_fdi?: string
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
    get: (id: number): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.get(`/patient-procedures/${id}`),

    create: (data: { patient_id: number, treatment_id: number, chair_id: number, tooth_fdi?: string, tooth_surface?: string, description?: string }): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post('/patient-procedures', data),

    createForPatient: (patientId: number, data: any): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/patients/${patientId}/procedures`, data),

    assign: (procedureId: number): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/patient-procedures/${procedureId}/assign`),

    complete: (procedureId: number, data?: { notes?: string }): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/patient-procedures/${procedureId}/complete`, data),

    update: (procedureId: number, data: { treatment_id?: number, chair_id?: number, notes?: string, tooth_description?: string, priority?: string }): Promise<AxiosResponse<ApiResponse>> =>
      this.client.put(`/patient-procedures/${procedureId}`, data),
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

    getMyCreatedPatients: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/my-created-patients'),
  }

  // Métodos para sesiones de tratamiento
  treatmentSessions = {
    list: (assignmentId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get(`/assignments/${assignmentId}/sessions`),
    
    create: (assignmentId: number, data: { session_date: string, notes?: string, status?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.post(`/assignments/${assignmentId}/sessions`, data),
    
    update: (sessionId: number, data: { session_date?: string, notes?: string, status?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.put(`/treatment-sessions/${sessionId}`, data),
    
    delete: (sessionId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.delete(`/treatment-sessions/${sessionId}`),
  }

  // Métodos de usuarios
  users = {
    updateProfile: (data: {
      name: string
      phone?: string
      birth_date?: string
      city?: string
      institution?: string
      university_id?: number
      course?: string
      facebook?: string
      instagram?: string
      tiktok?: string
    }): Promise<AxiosResponse<ApiResponse<User>>> =>
      this.client.put('/profile', data),

    uploadProfileImage: (imageBase64: string): Promise<AxiosResponse<ApiResponse<{ profile_image: string, profile_image_url: string }>>> =>
      this.client.post('/profile/image', { image: imageBase64 }),

    changePassword: (data: { current_password?: string, password: string, password_confirmation: string }): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post('/auth/change-password', data),
  }

  // Métodos de universidades
  universities = {
    list: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/universities'),
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

    markAllAsRead: (): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post('/notifications/read-all'),

    getRecentActivity: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/recent-activity'),
  }

  notificationPreferences = {
    list: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/notification-preferences'),

    update: (treatmentIds: number[]): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post('/notification-preferences', { treatment_ids: treatmentIds }),
  }

  // Métodos de anuncios (público)
  ads = {
    getActive: (position: string = 'dashboard_banner'): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get('/public/ads', { params: { position } }),

    trackClick: (id: number): Promise<AxiosResponse<ApiResponse>> =>
      this.client.post(`/ads/${id}/click`),
  }

  // Métodos de fotos de procedimientos
  procedurePhotos = {
    list: (assignmentId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
      this.client.get(`/assignments/${assignmentId}/photos`),

    uploadBase64: (assignmentId: number, data: { image: string, description?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.post(`/assignments/${assignmentId}/photos/base64`, data),

    update: (photoId: number, data: { description?: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
      this.client.put(`/procedure-photos/${photoId}`, data),

    delete: (photoId: number): Promise<AxiosResponse<ApiResponse>> =>
      this.client.delete(`/procedure-photos/${photoId}`),
  }

  // Métodos genéricos para llamadas directas
  get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config)
  }

  delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config)
  }
}

export const api = new ApiClient()
export type { User, Patient, Chair, ApiResponse, PaginatedResponse }
