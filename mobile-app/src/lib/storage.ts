import Constants from 'expo-constants'

const getBaseUrl = (): string => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || ''
  return apiUrl.replace('/api', '')
}

export const getStorageUrl = (path: string | undefined | null): string | null => {
  if (!path) return null
  const baseUrl = getBaseUrl()
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return `${baseUrl}${path}`
  return `${baseUrl}/storage/${path}`
}
