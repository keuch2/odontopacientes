import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  Clock,
  Activity,
  GraduationCap,
  Building2
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import StatsCard from '@/components/dashboard/StatsCard'
import ChairsProceduresChart from '@/components/dashboard/ChairsProceduresChart'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.stats.getDashboard(),
    enabled: user?.role === 'admin' || user?.role === 'coordinador',
  })

  const { data: chairsStats } = useQuery({
    queryKey: ['chairs-procedures'],
    queryFn: () => api.stats.getProceduresByChair(),
    enabled: user?.role === 'admin' || user?.role === 'coordinador',
  })

  const { data: myAssignments } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.students.getMyAssignments(),
    enabled: user?.role === 'alumno',
  })

  const isStudent = user?.role === 'alumno'
  const isAdmin = user?.role === 'admin' || user?.role === 'coordinador'

  const statsData = (stats?.data as any) || {}
  const chairsData = Array.isArray(chairsStats?.data) ? chairsStats.data : []
  const assignments = Array.isArray(myAssignments?.data) ? myAssignments.data : []

  // Obtener saludo según hora del día
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '¡Buenos días!'
    return '¡Buenas noches!'
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Panel de Super Administrador</h1>
        <p className="text-primary-100">
          Sistema de gestión y supervisión completa de OdontoPacientes
        </p>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getGreeting()}, {user?.name}
            </h1>
            <p className="text-slate-600 mt-1">
              {isStudent 
                ? `Estudiante de ${user?.faculty?.name}`
                : `${user?.role === 'admin' ? 'Administrador' : 
                    user?.role === 'coordinador' ? 'Coordinador' : 'Personal de Admisión'} - ${user?.faculty?.name}`
              }
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Building2 className="h-4 w-4" />
              <span>{user?.faculty?.university?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards para Admin/Coordinador */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Pacientes"
            value={statsData.patients_count || 0}
            icon={Users}
            color="blue"
            loading={statsLoading}
          />
          <StatsCard
            title="Disponibles"
            value={statsData.procedures_available || 0}
            icon={ClipboardList}
            color="green"
            loading={statsLoading}
          />
          <StatsCard
            title="En Proceso"
            value={statsData.procedures_in_progress || 0}
            icon={Clock}
            color="yellow"
            loading={statsLoading}
          />
          <StatsCard
            title="Completados"
            value={statsData.procedures_completed || 0}
            icon={CheckCircle2}
            color="purple"
            loading={statsLoading}
          />
        </div>
      )}

      {/* Stats para Estudiante */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Mis Asignaciones"
            value={assignments.filter((a: any) => a.status === 'activa').length}
            icon={Activity}
            color="blue"
          />
          <StatsCard
            title="Completadas"
            value={assignments.filter((a: any) => a.status === 'completada').length}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="En Progreso"
            value={assignments.filter((a: any) => a.status === 'activa').length}
            icon={Clock}
            color="yellow"
          />
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de procedimientos por cátedra (Admin/Coordinador) */}
        {isAdmin && (
          <div className="lg:col-span-2">
            <ChairsProceduresChart data={chairsData} />
          </div>
        )}

        {/* Mis asignaciones actuales (Estudiante) */}
        {isStudent && assignments.length > 0 && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Mis Asignaciones Actuales
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {assignments.slice(0, 5).map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          {assignment.patient_procedure.patient.full_name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {assignment.patient_procedure.treatment.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Cátedra: {assignment.patient_procedure.chair.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${
                            assignment.status === 'activa' ? 'badge-blue' :
                            assignment.status === 'completada' ? 'badge-green' :
                            'badge-gray'
                          }`}>
                            {assignment.status === 'activa' ? 'Activa' :
                             assignment.status === 'completada' ? 'Completada' :
                             'Abandonada'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Sesiones: {assignment.sessions_completed}/{assignment.patient_procedure.treatment.estimated_sessions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {assignments.length > 5 && (
                  <div className="mt-4 text-center">
                    <button className="btn btn-outline btn-sm">
                      Ver todas las asignaciones
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de bienvenida para estudiantes sin asignaciones */}
        {isStudent && assignments.length === 0 && (
          <div className="lg:col-span-2">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
              <GraduationCap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                ¡Bienvenido al sistema!
              </h3>
              <p className="text-primary-700 mb-4">
                Aún no tienes asignaciones activas. Puedes buscar pacientes disponibles para comenzar tus tratamientos.
              </p>
              <button 
                onClick={() => navigate('/patients')}
                className="btn btn-primary"
              >
                Buscar Pacientes
              </button>
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Enlaces rápidos */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isAdmin && (
            <>
              <button 
                onClick={() => navigate('/patients')}
                className="flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <Users className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-primary-900">Pacientes</span>
              </button>
              <button 
                onClick={() => navigate('/users')}
                className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <GraduationCap className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-900">Usuarios</span>
              </button>
            </>
          )}
          
          <button 
            onClick={() => navigate(isStudent ? '/my-assignments' : '/chairs')}
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ClipboardList className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">
              {isStudent ? 'Mis Casos' : 'Cátedras'}
            </span>
          </button>
          
          <button 
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Activity className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">Reportes</span>
          </button>
        </div>
      </div>
    </div>
  )
}
