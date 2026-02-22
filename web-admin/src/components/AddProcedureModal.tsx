import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api, apiClient } from '../lib/api'

interface Chair {
  id: number
  name: string
  key: string
  color: string
}

interface Treatment {
  id: number
  name: string
  code: string
  requires_tooth: boolean
  estimated_sessions: number
}

interface ProcedureFormData {
  treatment_id: number
  chair_id: number
  tooth_fdi?: string
  tooth_surface?: string
  notes?: string
  estimated_price?: number
  priority: 'baja' | 'media' | 'alta'
  status: 'disponible' | 'contraindicado'
}

interface AddProcedureModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: number
  patientName: string
  preselectedToothFdi?: string
}

export default function AddProcedureModal({ isOpen, onClose, patientId, patientName, preselectedToothFdi }: AddProcedureModalProps) {
  const queryClient = useQueryClient()
  const [selectedChairId, setSelectedChairId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProcedureFormData>({
    defaultValues: {
      priority: 'media',
      status: 'disponible',
      tooth_fdi: preselectedToothFdi || '',
    },
  })

  const { data: chairsData } = useQuery({
    queryKey: ['chairs'],
    queryFn: async () => {
      const response = await api.chairs.getAll()
      return response.data.data
    },
  })

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', selectedChairId],
    queryFn: async () => {
      if (!selectedChairId) return []
      const response = await apiClient.get(`/chairs/${selectedChairId}/treatments`)
      return response.data.data
    },
    enabled: !!selectedChairId,
  })

  const chairs: Chair[] = chairsData || []
  const treatments: Treatment[] = treatmentsData || []

  const chairId = watch('chair_id')
  const treatmentId = watch('treatment_id')

  useEffect(() => {
    if (chairId) {
      setSelectedChairId(Number(chairId))
      setValue('treatment_id', 0)
    }
  }, [chairId, setValue])

  const selectedTreatment = treatments.find(t => t.id === Number(treatmentId))

  const createMutation = useMutation({
    mutationFn: (data: ProcedureFormData) => apiClient.post(`/patients/${patientId}/procedures`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      queryClient.invalidateQueries({ queryKey: ['patient-procedures', patientId] })
      reset()
      onClose()
    },
  })

  const onSubmit = (data: ProcedureFormData) => {
    createMutation.mutate(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Asignar Procedimiento</h2>
              <p className="text-sm text-gray-600 mt-1">Paciente: {patientName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cátedra *
                </label>
                <select
                  {...register('chair_id', { required: 'La cátedra es requerida' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione una cátedra</option>
                  {chairs.map((chair) => (
                    <option key={chair.id} value={chair.id}>
                      {chair.name}
                    </option>
                  ))}
                </select>
                {errors.chair_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.chair_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tratamiento *
                </label>
                <select
                  {...register('treatment_id', { required: 'El tratamiento es requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedChairId}
                >
                  <option value="">Seleccione un tratamiento</option>
                  {treatments.map((treatment) => (
                    <option key={treatment.id} value={treatment.id}>
                      {treatment.code} - {treatment.name}
                    </option>
                  ))}
                </select>
                {errors.treatment_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.treatment_id.message}</p>
                )}
              </div>
            </div>

            {selectedTreatment?.requires_tooth && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diente (FDI) *
                  </label>
                  <input
                    type="text"
                    {...register('tooth_fdi', { 
                      required: selectedTreatment?.requires_tooth ? 'El diente es requerido' : false,
                      pattern: {
                        value: /^[1-8][1-8]$/,
                        message: 'Formato FDI inválido (ej: 11, 21, 36)'
                      }
                    })}
                    placeholder="Ej: 11, 21, 36"
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.tooth_fdi && (
                    <p className="mt-1 text-sm text-red-600">{errors.tooth_fdi.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Notación FDI: 11-18 (sup. der.), 21-28 (sup. izq.), 31-38 (inf. izq.), 41-48 (inf. der.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie (opcional)
                  </label>
                  <input
                    type="text"
                    {...register('tooth_surface', {
                      pattern: {
                        value: /^[OMDVL]+$/i,
                        message: 'Solo letras O, M, D, V, L'
                      }
                    })}
                    placeholder="Ej: O, MOD, MODV"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.tooth_surface && (
                    <p className="mt-1 text-sm text-red-600">{errors.tooth_surface.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    O=Oclusal, M=Mesial, D=Distal, V=Vestibular, L=Lingual
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Observaciones adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Estimado
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('estimated_price')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="disponible">Disponible</option>
                  <option value="contraindicado">Contraindicado</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Asignar Procedimiento'}
              </button>
            </div>

            {createMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  Error al crear el procedimiento. Por favor, intente nuevamente.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
