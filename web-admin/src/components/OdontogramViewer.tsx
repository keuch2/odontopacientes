import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { Loader2, AlertCircle, Plus, Filter } from 'lucide-react'

interface PatientProcedure {
  id: number
  treatment: {
    id: number
    name: string
    code: string
  }
  chair: {
    id: number
    name: string
    color: string
  }
  tooth_fdi: string | null
  tooth_surface: string | null
  status: 'disponible' | 'proceso' | 'finalizado' | 'contraindicado'
  notes: string | null
  priority: string
}

interface Chair {
  id: number
  name: string
  color: string
}

interface OdontogramViewerProps {
  patientId: number
  onAddProcedure?: (toothFdi: string) => void
}

const PROCEDURE_STATUS_CONFIG = {
  disponible: { label: 'Disponible', color: '#FEF3C7', borderColor: '#F59E0B' },
  proceso: { label: 'En Proceso', color: '#DBEAFE', borderColor: '#3B82F6' },
  finalizado: { label: 'Finalizado', color: '#D1FAE5', borderColor: '#10B981' },
  contraindicado: { label: 'Contraindicado', color: '#FEE2E2', borderColor: '#EF4444' },
}

const PERMANENT_TEETH = {
  upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
  upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
  lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
  lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
}

export default function OdontogramViewer({ patientId, onAddProcedure }: OdontogramViewerProps) {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterChair, setFilterChair] = useState<string>('all')

  const { data: proceduresData, isLoading, isError } = useQuery({
    queryKey: ['patient-procedures', patientId],
    queryFn: async () => {
      const response = await apiClient.get('/patients/' + patientId + '/procedures')
      return response.data.data as PatientProcedure[]
    },
  })

  const { data: chairsData } = useQuery({
    queryKey: ['chairs'],
    queryFn: async () => {
      const response = await apiClient.get('/chairs')
      return response.data.data as Chair[]
    },
  })

  const procedures = proceduresData || []
  const chairs = chairsData || []

  // Aplicar filtros
  const filteredProcedures = procedures.filter(procedure => {
    if (filterStatus !== 'all' && procedure.status !== filterStatus) return false
    if (filterChair !== 'all' && procedure.chair.id.toString() !== filterChair) return false
    return true
  })

  const proceduresByTooth = filteredProcedures.reduce((acc, procedure) => {
    if (procedure.tooth_fdi) {
      if (!acc[procedure.tooth_fdi]) {
        acc[procedure.tooth_fdi] = []
      }
      acc[procedure.tooth_fdi].push(procedure)
    }
    return acc
  }, {} as Record<string, PatientProcedure[]>)

  const getToothStatus = (toothFdi: string): keyof typeof PROCEDURE_STATUS_CONFIG | null => {
    const toothProcedures = proceduresByTooth[toothFdi]
    if (!toothProcedures || toothProcedures.length === 0) return null

    if (toothProcedures.some(p => p.status === 'proceso')) return 'proceso'
    if (toothProcedures.some(p => p.status === 'disponible')) return 'disponible'
    if (toothProcedures.some(p => p.status === 'finalizado')) return 'finalizado'
    if (toothProcedures.some(p => p.status === 'contraindicado')) return 'contraindicado'
    
    return null
  }

  const handleToothClick = (toothFdi: string) => {
    setSelectedTooth(selectedTooth === toothFdi ? null : toothFdi)
  }

  const handleAddProcedure = (toothFdi: string) => {
    if (onAddProcedure) {
      onAddProcedure(toothFdi)
    }
  }

  const renderTooth = (toothFdi: string) => {
    const status = getToothStatus(toothFdi)
    const config = status ? PROCEDURE_STATUS_CONFIG[status] : null
    const isSelected = selectedTooth === toothFdi
    const toothProcedures = proceduresByTooth[toothFdi] || []

    return (
      <div key={toothFdi} className="flex flex-col items-center">
        <button
          onClick={() => handleToothClick(toothFdi)}
          className={'w-12 h-16 border-2 rounded-lg transition-all relative ' + (isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : '') + ' ' + (config ? 'cursor-pointer hover:scale-110' : 'cursor-pointer hover:bg-gray-50')}
          style={{
            backgroundColor: config?.color || '#FFFFFF',
            borderColor: config?.borderColor || '#D1D5DB',
          }}
          title={toothProcedures.length > 0 ? toothProcedures.length + ' procedimiento(s)' : 'Sin procedimientos'}
        >
          {toothProcedures.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {toothProcedures.length}
            </span>
          )}
        </button>
        <span className="text-xs mt-1 font-medium text-gray-700">{toothFdi}</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando odontograma...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800">Error al cargar el odontograma</p>
          <p className="text-sm text-red-600 mt-1">No se pudieron cargar los procedimientos del paciente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Odontograma basado en procedimientos:</strong> Los colores indican el estado de los procedimientos asignados a cada diente. Haz clic en un diente para ver sus procedimientos o agregar uno nuevo.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-700">Filtros</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="proceso">En Proceso</option>
              <option value="finalizado">Finalizado</option>
              <option value="contraindicado">Contraindicado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cátedra</label>
            <select
              value={filterChair}
              onChange={(e) => setFilterChair(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las cátedras</option>
              {chairs.map(chair => (
                <option key={chair.id} value={chair.id.toString()}>{chair.name}</option>
              ))}
            </select>
          </div>
        </div>
        {(filterStatus !== 'all' || filterChair !== 'all') && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {filteredProcedures.length} de {procedures.length} procedimientos
            </p>
            <button
              onClick={() => {
                setFilterStatus('all')
                setFilterChair('all')
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 text-center">ARCADA SUPERIOR</h3>
            <div className="flex justify-center gap-8">
              <div className="flex gap-2">
                {PERMANENT_TEETH.upperRight.map(tooth => renderTooth(tooth))}
              </div>
              <div className="flex gap-2">
                {PERMANENT_TEETH.upperLeft.map(tooth => renderTooth(tooth))}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-gray-300"></div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 text-center">ARCADA INFERIOR</h3>
            <div className="flex justify-center gap-8">
              <div className="flex gap-2">
                {PERMANENT_TEETH.lowerLeft.map(tooth => renderTooth(tooth))}
              </div>
              <div className="flex gap-2">
                {PERMANENT_TEETH.lowerRight.map(tooth => renderTooth(tooth))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Leyenda de Estados</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(PROCEDURE_STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 rounded" style={{ backgroundColor: config.color, borderColor: config.borderColor }} />
              <span className="text-sm text-gray-700">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedTooth && (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">Diente {selectedTooth}</h4>
            <button onClick={() => handleAddProcedure(selectedTooth)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Plus className="w-4 h-4" />
              Agregar Procedimiento
            </button>
          </div>

          {proceduresByTooth[selectedTooth] && proceduresByTooth[selectedTooth].length > 0 ? (
            <div className="space-y-3">
              {proceduresByTooth[selectedTooth].map((procedure) => (
                <div key={procedure.id} className="border border-gray-200 rounded-lg p-3" style={{ borderLeftWidth: '4px', borderLeftColor: PROCEDURE_STATUS_CONFIG[procedure.status].borderColor }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{procedure.treatment.name}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{procedure.treatment.code}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Cátedra:</strong> {procedure.chair.name}</p>
                        {procedure.tooth_surface && <p><strong>Superficie:</strong> {procedure.tooth_surface}</p>}
                        {procedure.notes && <p><strong>Notas:</strong> {procedure.notes}</p>}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: PROCEDURE_STATUS_CONFIG[procedure.status].color, color: '#1F2937' }}>
                      {PROCEDURE_STATUS_CONFIG[procedure.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-3">No hay procedimientos asignados a este diente</p>
              <button onClick={() => handleAddProcedure(selectedTooth)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                Agregar Primer Procedimiento
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
