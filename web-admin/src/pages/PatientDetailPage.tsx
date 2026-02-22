import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PatientFormModal from '../components/PatientFormModal'
import AddProcedureModal from '../components/AddProcedureModal'
import OdontogramViewer from '../components/OdontogramViewer'
import { 
  ArrowLeft, 
  Edit2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Activity,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { api } from '../lib/api'
import type { ApiResponse } from '../lib/api'

interface Patient {
  id: number
  first_name: string
  last_name: string
  document_number: string
  email: string
  phone: string
  birth_date: string
  gender: 'M' | 'F' | 'O'
  address: string
  city: string
  // Ficha médica
  has_allergies: boolean
  allergies_description?: string
  has_chronic_diseases: boolean
  chronic_diseases_description?: string
  takes_medications: boolean
  medications_description?: string
  has_previous_surgeries: boolean
  previous_surgeries_description?: string
  emergency_contact_name: string
  emergency_contact_phone: string
  // Relaciones
  procedures?: Array<{
    id: number
    treatment: {
      id: number
      name: string
      chair: {
        id: number
        name: string
      }
    }
    tooth_fdi: string | null
    tooth_surface: string | null
    status: string
    sessions_completed: number
    sessions_total: number
    price: string
    created_at: string
    updated_at: string
  }>
  odontogram?: {
    id: number
    created_at: string
    updated_at: string
  }
  created_at: string
  updated_at: string
}

type TabType = 'info' | 'medical' | 'procedures' | 'odontogram' | 'photos'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddProcedureModalOpen, setIsAddProcedureModalOpen] = useState(false)
  const [preselectedToothFdi, setPreselectedToothFdi] = useState<string | undefined>(undefined)

  const { data, isLoading, isError, error } = useQuery<ApiResponse<Patient>>({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.patients.getById(Number(id))
      return response.data
    },
    enabled: !!id,
  })

  const patient = data?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (isError || !patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">Error al cargar el paciente</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Paciente no encontrado'}
          </p>
          <button
            onClick={() => navigate('/patients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Pacientes
          </button>
        </div>
      </div>
    )
  }

  const fullName = `${patient.first_name} ${patient.last_name}`
  const age = new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
  const genderLabel = patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'

  const tabs = [
    { id: 'info' as TabType, label: 'Información Personal', icon: User },
    { id: 'medical' as TabType, label: 'Ficha Médica', icon: FileText },
    { id: 'procedures' as TabType, label: 'Procedimientos', icon: Activity },
    { id: 'odontogram' as TabType, label: 'Odontograma', icon: AlertCircle },
    { id: 'photos' as TabType, label: 'Fotos', icon: ImageIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {patient.document_number} • {age} años • {genderLabel}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Editar Paciente
        </button>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="text-sm font-medium text-gray-900">{patient.phone}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">{patient.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ciudad</p>
              <p className="text-sm font-medium text-gray-900">{patient.city}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Procedimientos</p>
              <p className="text-sm font-medium text-gray-900">
                {patient.procedures?.length || 0} activos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Información Personal */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                    <p className="text-base text-gray-900 mt-1">{fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Documento</label>
                    <p className="text-base text-gray-900 mt-1">{patient.document_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-base text-gray-900">
                        {new Date(patient.birth_date).toLocaleDateString('es-PY')} ({age} años)
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Género</label>
                    <p className="text-base text-gray-900 mt-1">{genderLabel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-base text-gray-900 mt-1">{patient.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-base text-gray-900 mt-1">{patient.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Dirección</label>
                    <p className="text-base text-gray-900 mt-1">{patient.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ciudad</label>
                    <p className="text-base text-gray-900 mt-1">{patient.city}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-base text-gray-900 mt-1">{patient.emergency_contact_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-base text-gray-900 mt-1">{patient.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Ficha Médica */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Anamnesis</h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${patient.has_allergies ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <AlertCircle className={`w-5 h-5 ${patient.has_allergies ? 'text-red-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Alergias</p>
                      {patient.has_allergies ? (
                        <p className="text-sm text-gray-600 mt-1">{patient.allergies_description || 'Sin descripción'}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No presenta alergias</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${patient.has_chronic_diseases ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <Activity className={`w-5 h-5 ${patient.has_chronic_diseases ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Enfermedades Crónicas</p>
                      {patient.has_chronic_diseases ? (
                        <p className="text-sm text-gray-600 mt-1">{patient.chronic_diseases_description || 'Sin descripción'}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No presenta enfermedades crónicas</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${patient.takes_medications ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <FileText className={`w-5 h-5 ${patient.takes_medications ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Medicamentos</p>
                      {patient.takes_medications ? (
                        <p className="text-sm text-gray-600 mt-1">{patient.medications_description || 'Sin descripción'}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No toma medicamentos</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${patient.has_previous_surgeries ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <Activity className={`w-5 h-5 ${patient.has_previous_surgeries ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Cirugías Previas</p>
                      {patient.has_previous_surgeries ? (
                        <p className="text-sm text-gray-600 mt-1">{patient.previous_surgeries_description || 'Sin descripción'}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No ha tenido cirugías previas</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Procedimientos */}
          {activeTab === 'procedures' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Procedimientos del Paciente</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Asignar Procedimiento
                </button>
              </div>

              {patient.procedures && patient.procedures.length > 0 ? (
                <div className="space-y-3">
                  {patient.procedures.map((procedure) => {
                    const statusColors = {
                      disponible: 'bg-green-100 text-green-800',
                      proceso: 'bg-yellow-100 text-yellow-800',
                      finalizado: 'bg-blue-100 text-blue-800',
                      contraindicado: 'bg-red-100 text-red-800',
                    }
                    const statusLabels = {
                      disponible: 'Disponible',
                      proceso: 'En Proceso',
                      finalizado: 'Finalizado',
                      contraindicado: 'Contraindicado',
                    }

                    return (
                      <div key={procedure.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{procedure.treatment.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[procedure.status as keyof typeof statusColors]}`}>
                                {statusLabels[procedure.status as keyof typeof statusLabels]}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Cátedra: {procedure.treatment.chair.name}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Diente: {procedure.tooth_fdi || 'No especificado'}{procedure.tooth_surface ? ` (${procedure.tooth_surface})` : ''}</span>
                              <span>Sesiones: {procedure.sessions_completed}/{procedure.sessions_total}</span>
                              <span>Precio: Gs. {Number(procedure.price).toLocaleString('es-PY')}</span>
                            </div>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Ver Detalle
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay procedimientos asignados</p>
                  <button 
                    onClick={() => setIsAddProcedureModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Asignar Primer Procedimiento
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab: Odontograma */}
          {activeTab === 'odontogram' && (
            <OdontogramViewer 
              patientId={Number(id)} 
              onAddProcedure={(toothFdi) => {
                setPreselectedToothFdi(toothFdi)
                setIsAddProcedureModalOpen(true)
              }}
            />
          )}

          {/* Tab: Fotos */}
          {activeTab === 'photos' && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No hay fotos cargadas</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Subir Fotos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      <PatientFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={patient}
      />

      {/* Modal de asignación de procedimientos */}
      <AddProcedureModal
        isOpen={isAddProcedureModalOpen}
        onClose={() => {
          setIsAddProcedureModalOpen(false)
          setPreselectedToothFdi(undefined)
        }}
        patientId={Number(id)}
        patientName={`${patient.first_name} ${patient.last_name}`}
        preselectedToothFdi={preselectedToothFdi}
      />
    </div>
  )
}
