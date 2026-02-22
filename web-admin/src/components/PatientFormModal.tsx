import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useEffect } from 'react'

interface PatientFormData {
  first_name: string
  last_name: string
  document_type: string
  document_number: string
  email: string
  phone: string
  birthdate: string
  gender: 'M' | 'F' | 'Other'
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
  smoking_status?: 'no' | 'ocasional' | 'regular' | 'exfumador'
  alcohol_consumption?: 'no' | 'ocasional' | 'moderado' | 'frecuente'
  pregnancy_status?: boolean
  breastfeeding_status?: boolean
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
}

interface PatientFormModalProps {
  isOpen: boolean
  onClose: () => void
  patient?: PatientFormData & { id: number }
}

export default function PatientFormModal({ isOpen, onClose, patient }: PatientFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!patient

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    defaultValues: {
      document_type: 'CI',
      gender: 'M',
      has_allergies: false,
      has_chronic_diseases: false,
      takes_medications: false,
      has_previous_surgeries: false,
      smoking_status: 'no',
      alcohol_consumption: 'no',
      pregnancy_status: false,
      breastfeeding_status: false,
    },
  })

  // Actualizar formulario cuando cambie el paciente
  useEffect(() => {
    if (patient) {
      reset(patient)
    } else {
      reset({
        document_type: 'CI',
        gender: 'M',
        has_allergies: false,
        has_chronic_diseases: false,
        takes_medications: false,
        has_previous_surgeries: false,
        smoking_status: 'no',
        alcohol_consumption: 'no',
        pregnancy_status: false,
        breastfeeding_status: false,
      })
    }
  }, [patient, reset])

  const createMutation = useMutation({
    mutationFn: (data: PatientFormData) => api.patients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      reset()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: PatientFormData) => api.patients.update(patient!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient', patient!.id] })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.patients.delete(patient!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      onClose()
    },
  })

  const handleDelete = () => {
    if (confirm('¿Está seguro de que desea eliminar este paciente? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate()
    }
  }

  const onSubmit = (data: PatientFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const hasAllergies = watch('has_allergies')
  const hasChronicDiseases = watch('has_chronic_diseases')
  const takesMedications = watch('takes_medications')
  const hasPreviousSurgeries = watch('has_previous_surgeries')
  const gender = watch('gender')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Datos Personales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    {...register('first_name', { required: 'El nombre es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    {...register('last_name', { required: 'El apellido es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    {...register('document_type', { required: 'El tipo de documento es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CI">Cédula de Identidad</option>
                    <option value="RUC">RUC</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                  {errors.document_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.document_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    {...register('document_number', { required: 'El documento es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.document_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.document_number.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    {...register('birthdate', { required: 'La fecha de nacimiento es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.birthdate && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género *
                  </label>
                  <select
                    {...register('gender', { required: 'El género es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Other">Otro</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    {...register('phone', { required: 'El teléfono es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido',
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    {...register('city', { required: 'La ciudad es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    {...register('address', { required: 'La dirección es requerida' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha Médica */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ficha Médica (Anamnesis)</h3>
              <div className="space-y-4">
                {/* Alergias */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('has_allergies')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Tiene alergias?</span>
                  </label>
                  {hasAllergies && (
                    <textarea
                      {...register('allergies_description')}
                      placeholder="Describa las alergias..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Enfermedades Crónicas */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('has_chronic_diseases')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Tiene enfermedades crónicas?</span>
                  </label>
                  {hasChronicDiseases && (
                    <textarea
                      {...register('chronic_diseases_description')}
                      placeholder="Describa las enfermedades crónicas..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Medicamentos */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('takes_medications')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Toma medicamentos?</span>
                  </label>
                  {takesMedications && (
                    <textarea
                      {...register('medications_description')}
                      placeholder="Describa los medicamentos..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Cirugías Previas */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('has_previous_surgeries')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Ha tenido cirugías previas?</span>
                  </label>
                  {hasPreviousSurgeries && (
                    <textarea
                      {...register('previous_surgeries_description')}
                      placeholder="Describa las cirugías previas..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Hábitos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado de Fumador
                    </label>
                    <select
                      {...register('smoking_status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="no">No fuma</option>
                      <option value="ocasional">Fumador ocasional</option>
                      <option value="regular">Fumador regular</option>
                      <option value="exfumador">Ex-fumador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Consumo de Alcohol
                    </label>
                    <select
                      {...register('alcohol_consumption')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="no">No consume</option>
                      <option value="ocasional">Ocasional</option>
                      <option value="moderado">Moderado</option>
                      <option value="frecuente">Frecuente</option>
                    </select>
                  </div>
                </div>

                {/* Campos específicos para mujeres */}
                {gender === 'F' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-pink-50 rounded-lg">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('pregnancy_status')}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm font-medium text-gray-700">¿Está embarazada?</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('breastfeeding_status')}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm font-medium text-gray-700">¿Está en período de lactancia?</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Contacto *
                  </label>
                  <input
                    type="text"
                    {...register('emergency_contact_name', { required: 'El nombre del contacto es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.emergency_contact_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono del Contacto *
                  </label>
                  <input
                    type="tel"
                    {...register('emergency_contact_phone', { required: 'El teléfono del contacto es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.emergency_contact_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relación *
                  </label>
                  <input
                    type="text"
                    {...register('emergency_contact_relationship', { required: 'La relación es requerida' })}
                    placeholder="Ej: Madre, Esposo, Hermano"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.emergency_contact_relationship && (
                    <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_relationship.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
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
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Paciente'}
                </button>
              </div>
            </div>

            {/* Error de mutación */}
            {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {deleteMutation.isError 
                    ? 'Error al eliminar el paciente. Verifique que no tenga procedimientos en proceso.'
                    : `Error al ${isEditing ? 'actualizar' : 'crear'} el paciente. Por favor, intente nuevamente.`
                  }
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
