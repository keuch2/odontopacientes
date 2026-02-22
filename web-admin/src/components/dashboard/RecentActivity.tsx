import { useQuery } from '@tanstack/react-query'
import { Clock, User, FileText, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface ActivityItem {
  id: number
  type: 'assignment' | 'procedure_completed' | 'patient_registered' | 'consent_signed'
  message: string
  created_at: string
  user?: {
    name: string
  }
}

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => api.notifications.getAll({ page: 1, per_page: 5 }),
    refetchInterval: 30000, // Refetch cada 30 segundos
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <User className="h-4 w-4 text-blue-600" />
      case 'procedure_completed':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'patient_registered':
        return <User className="h-4 w-4 text-purple-600" />
      case 'consent_signed':
        return <FileText className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-slate-600" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Actividad Reciente
          </h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todo
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : Array.isArray(activities?.data) && activities.data.length > 0 ? (
          <div className="space-y-4">
            {activities.data.slice(0, 8).map((activity: ActivityItem) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 mb-1">
                    {activity.message}
                  </p>
                  <div className="flex items-center text-xs text-slate-500">
                    {activity.user && (
                      <span className="mr-2">por {activity.user.name}</span>
                    )}
                    <span>{formatTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">
              No hay actividad reciente para mostrar
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Las acciones del sistema aparecerán aquí
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
