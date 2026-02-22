import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Download, Plus, Eye, Edit2, Loader2, X } from 'lucide-react'
import { api } from '../lib/api'
import type { ApiResponse } from '../lib/api'
import PatientFormModal from '../components/PatientFormModal'

interface Patient {
  id: number
  first_name: string
  last_name: string
  document_number: string
  email: string
  phone: string
  city: string
  procedures?: Array<{
    id: number
    treatment: {
      name: string
    }
    status: string
  }>
  created_at: string
}

export default function PatientsPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setCurrentPage(1) // Reset to first page on search
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch patients from API
  const { data, isLoading, isError, error } = useQuery<ApiResponse<Patient[]>>({
    queryKey: ['patients', searchTerm, filterCity, currentPage],
    queryFn: async () => {
      const response = await api.patients.getAll({
        q: searchTerm || undefined,
        city: filterCity || undefined,
        page: currentPage,
        per_page: 20,
      })
      return response.data
    },
  })

  const patients = data?.data || []

  // Filtrar pacientes localmente por status (la búsqueda y ciudad se manejan en la API)
  const filteredPatients = useMemo(() => {
    if (!filterStatus) return patients
    
    return patients.filter((patient) => {
      const hasStatus = patient.procedures?.some(p => p.status === filterStatus)
      return hasStatus
    })
  }, [patients, filterStatus])

  // Obtener ciudades únicas para el filtro
  const cities = useMemo(() => {
    const uniqueCities = new Set(patients.map(p => p.city).filter(Boolean))
    return Array.from(uniqueCities).sort()
  }, [patients])

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchTerm) count++
    if (filterCity) count++
    if (filterStatus) count++
    return count
  }, [searchTerm, filterCity, filterStatus])

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setFilterCity('')
    setFilterStatus('')
    setCurrentPage(1)
  }

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filterCity, filterStatus])

  // Manejar estados de carga y error
  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error al cargar pacientes</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.meta ? `${data.meta.total} pacientes registrados` : 'Gestión de pacientes del sistema'}
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingPatient(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isLoading}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro de ciudad */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Todas las ciudades</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Filtro de estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="proceso">En Proceso</option>
            <option value="finalizado">Finalizado</option>
          </select>

          {/* Limpiar filtros */}
          {activeFiltersCount > 0 && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Limpiar todos los filtros"
            >
              <X className="w-4 h-4" />
              Limpiar ({activeFiltersCount})
            </button>
          )}

          {/* Botón exportar */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 font-medium">No se encontraron pacientes</p>
              <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Procedimientos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => {
                const fullName = `${patient.first_name} ${patient.last_name}`
                const procedureCount = patient.procedures?.length || 0
                const activeProcedures = patient.procedures?.filter(p => p.status === 'proceso').length || 0
                
                return (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.document_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.email}</div>
                      <div className="text-sm text-gray-500">{patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.city || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {procedureCount} procedimiento{procedureCount !== 1 ? 's' : ''}
                        {activeProcedures > 0 && (
                          <span className="ml-2 text-xs text-yellow-600">({activeProcedures} activo{activeProcedures !== 1 ? 's' : ''})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingPatient(patient)
                            setIsModalOpen(true)
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de creación/edición */}
      <PatientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPatient(null)
        }}
        patient={editingPatient}
      />

      {/* Paginación */}
      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{data.meta.from}</span> a{' '}
              <span className="font-medium">{data.meta.to}</span> de{' '}
              <span className="font-medium">{data.meta.total}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {data.meta.last_page}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(data.meta.last_page, prev + 1))}
              disabled={currentPage === data.meta.last_page}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
