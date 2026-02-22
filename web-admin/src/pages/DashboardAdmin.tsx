import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Users, UserCheck, Activity, GraduationCap, ClipboardList, Loader2, Clock } from 'lucide-react'
import { api } from '@/lib/api'

const actionColors: Record<string, string> = {
  created: 'text-green-600',
  updated: 'text-blue-600',
  deleted: 'text-red-600',
  assigned: 'text-purple-600',
  completed: 'text-cyan-600',
  cancelled: 'text-orange-600',
  login: 'text-emerald-600',
  logout: 'text-slate-500',
}

export default function DashboardAdmin() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.stats.getDashboard(),
    refetchInterval: 60_000,
  })

  const stats = statsData?.data?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const recentAudits: any[] = stats?.recent_audits ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Panel de Administrador</h1>
        <p className="text-primary-100">Sistema de gestión y supervisión de OdontoPacientes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Usuarios Totales</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.users_count ?? '—'}</p>
              <p className="text-sm text-green-600 mt-1">{stats?.users_active ?? 0} activos</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pacientes Registrados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.patients_count ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">{stats?.procedures_available ?? 0} procedimientos disponibles</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Procedimientos Activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.procedures_in_progress ?? '—'}</p>
              <p className="text-sm text-cyan-600 mt-1">{stats?.procedures_completed ?? 0} finalizados</p>
            </div>
            <div className="h-12 w-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Universidades</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.universities_count ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">{stats?.chairs_count ?? 0} cátedras activas</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Procedures Summary + Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procedures breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Resumen de Procedimientos
            </h3>
          </div>
          <div className="card-body space-y-4">
            {[
              { label: 'Disponibles', value: stats?.procedures_available ?? 0, color: 'bg-blue-500', total: (stats?.procedures_available ?? 0) + (stats?.procedures_in_progress ?? 0) + (stats?.procedures_completed ?? 0) },
              { label: 'En Proceso', value: stats?.procedures_in_progress ?? 0, color: 'bg-amber-500', total: (stats?.procedures_available ?? 0) + (stats?.procedures_in_progress ?? 0) + (stats?.procedures_completed ?? 0) },
              { label: 'Finalizados', value: stats?.procedures_completed ?? 0, color: 'bg-green-500', total: (stats?.procedures_available ?? 0) + (stats?.procedures_in_progress ?? 0) + (stats?.procedures_completed ?? 0) },
            ].map(({ label, value, color, total }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: total > 0 ? `${Math.round((value / total) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">Asignaciones activas</span>
              <span className="font-semibold text-slate-900">{stats?.assignments_active ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Audit Log */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              Auditoría Reciente
            </h3>
          </div>
          <div className="card-body">
            {recentAudits.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Sin registros de auditoría</p>
            ) : (
              <div className="space-y-3">
                {recentAudits.map((audit: any) => (
                  <div key={audit.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${actionColors[audit.action] ?? 'text-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        <span className={actionColors[audit.action] ?? 'text-slate-600'}>{audit.action_label}</span>
                        {' '}{audit.entity_label} #{audit.entity_id}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{audit.user}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{audit.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
