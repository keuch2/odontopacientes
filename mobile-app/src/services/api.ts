import axios, { AxiosInstance, AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Detectar automáticamente la URL correcta según la plataforma
const getApiBaseUrl = () => {
  // En web y simuladores iOS, usar localhost
  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    return 'http://localhost/odontopacientes/backend/public/api'
  }
  // En dispositivos Android físicos, usar la IP de red
  return 'http://192.168.100.82/odontopacientes/backend/public/api'
}

const API_BASE_URL = getApiBaseUrl()

class ApiService {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token')
          await AsyncStorage.removeItem('user_data')
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.axiosInstance.get(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.put(url, data, config)
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.axiosInstance.patch(url, data, config)
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.axiosInstance.delete(url, config)
  }

  setAuthToken(token: string) {
    AsyncStorage.setItem('auth_token', token)
  }

  async clearAuthToken() {
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('user_data')
  }

  getBaseURL(): string {
    return API_BASE_URL
  }
}

export const api = new ApiService()
export default api
