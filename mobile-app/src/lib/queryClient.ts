import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

let refreshTimer: ReturnType<typeof setTimeout> | undefined

/** Marca los datos como obsoletos tras una escritura y agrupa las ráfagas. */
export const refreshCachedData = () => {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => queryClient.invalidateQueries(), 300)
}
