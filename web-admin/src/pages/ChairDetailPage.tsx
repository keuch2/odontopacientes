import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  ClipboardList, 
  CheckCircle, 
  Clock,
  Loader2,
  Edit2,
  Plus,
  Trash2,
  X,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Tag,
} from 'lucide-react'
import { api } from '@/lib/api'

interface TreatmentForm {
  name: string
  code: string
  description: string
  requires_tooth: boolean
  applies_to_all_upper: boolean
  applies_to_all_lower: boolean
  estimated_sessions: number
  base_price: string
  active: boolean
}

const emptyTreatmentForm: TreatmentForm = {
  name: '', code: '', description: '', requires_tooth: false,
  applies_to_all_upper: false, applies_to_all_lower: false,
  estimated_sessions: 1, base_price: '', active: true,
}

export default function ChairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<any>(null)
  const [form, setForm] = useState<TreatmentForm>(emptyTreatmentForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [subclassInput, setSubclassInput] = useState<Record<number, string>>({})
  const [editingSubclass, setEditingSubclass] = useState<{ treatmentId: number; subclassId: number; name: string } | null>(null)
  const [optionInput, setOptionInput] = useState<Record<number, string>>({})
  const [editingOption, setEditingOption] = useState<{ treatmentId: number; optionId: number; name: string } | null>(null)

  const { data: chairData, isLoading: chairLoading } = useQuery({
    queryKey: ['chair', id],
    queryFn: () => api.chairs.getById(Number(id)),
  })

  const chair = chairData?.data?.data
  const treatments = Array.isArray(chair?.treatments) ? chair.treatments : []

  const createMutation = useMutation({
    mutationFn: (data: any) => api.treatments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ tid, data }: { tid: number; data: any }) => api.treatments.update(tid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tid: number) => api.treatments.delete(tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      setDeleteConfirm(null)
    },
  })

  const createSubclassMutation = useMutation({
    mutationFn: ({ treatmentId, name }: { treatmentId: number; name: string }) =>
      api.treatmentSubclasses.create(treatmentId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      setSubclassInput({})
    },
  })

  const updateSubclassMutation = useMutation({
    mutationFn: ({ treatmentId, subclassId, name }: { treatmentId: number; subclassId: number; name: string }) =>
      api.treatmentSubclasses.update(treatmentId, subclassId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      setEditingSubclass(null)
    },
  })

  const deleteSubclassMutation = useMutation({
    mutationFn: ({ treatmentId, subclassId }: { treatmentId: number; subclassId: number }) =>
      api.treatmentSubclasses.delete(treatmentId, subclassId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
    },
  })

  const createOptionMutation = useMutation({
    mutationFn: ({ treatmentId, name }: { treatmentId: number; name: string }) =>
      api.subclassOptions.create(treatmentId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      setOptionInput({})
    },
  })

  const updateOptionMutation = useMutation({
    mutationFn: ({ treatmentId, optionId, name }: { treatmentId: number; optionId: number; name: string }) =>
      api.subclassOptions.update(treatmentId, optionId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
      setEditingOption(null)
    },
  })

  const deleteOptionMutation = useMutation({
    mutationFn: ({ treatmentId, optionId }: { treatmentId: number; optionId: number }) =>
      api.subclassOptions.delete(treatmentId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chair', id] })
    },
  })

  const openCreate = () => {
    setEditingTreatment(null)
    setForm(emptyTreatmentForm)
    setShowModal(true)
  }

  const openEdit = (t: any) => {
    setEditingTreatment(t)
    setForm({
      name: t.name || '',
      code: t.code || '',
      description: t.description || '',
      requires_tooth: t.requires_tooth ?? false,
      applies_to_all_upper: t.applies_to_all_upper ?? false,
      applies_to_all_lower: t.applies_to_all_lower ?? false,
      estimated_sessions: t.estimated_sessions ?? 1,
      base_price: t.base_price ? String(t.base_price) : '',
      active: t.active ?? true,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTreatment(null)
    setForm(emptyTreatmentForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      chair_id: Number(id),
      base_price: form.base_price ? parseFloat(form.base_price) : null,
    }
    if (editingTreatment) {
      updateMutation.mutate({ tid: editingTreatment.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (chairLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!chair) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Cátedra no encontrada</h2>
        <button onClick={() => navigate('/chairs')} className="mt-4 btn btn-primary">
          Volver a Cátedras
        </button>
      </div>
    )
  }

  const stats = chair.stats || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/chairs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Cátedras
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div
                className="h-16 w-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: chair.color || '#6366F1' }}
              >
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900">{chair.name}</h1>
                <p className="text-gray-600 mt-1">
                  {chair.description || 'Gestión de tratamientos y procedimientos'}
                </p>
              </div>
            </div>
            <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Tratamiento
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tratamientos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{treatments.length}</p>
            </div>
            <ClipboardList className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.procedures_available || 0}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.procedures_in_progress || 0}</p>
            </div>
            <Clock className="h-10 w-10 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.procedures_completed || 0}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tratamientos */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tratamientos de la Cátedra</h2>
          <button onClick={openCreate} className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
        <div className="p-6">
          {treatments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatments.map((treatment: any) => (
                <div
                  key={treatment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{treatment.name}</h3>
                        {!treatment.active && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactivo</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{treatment.code}</p>
                      {treatment.description && (
                        <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                      )}
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500">
                          Sesiones estimadas: {treatment.estimated_sessions || 1}
                        </p>
                        {treatment.base_price && (
                          <p className="text-xs text-gray-500">Precio base: ${treatment.base_price}</p>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {treatment.requires_tooth && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Requiere diente</span>
                        )}
                        {treatment.applies_to_all_upper && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowUpFromLine className="h-3 w-3" /> Sup. completa
                          </span>
                        )}
                        {treatment.applies_to_all_lower && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowDownFromLine className="h-3 w-3" /> Inf. completa
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => openEdit(treatment)} className="text-gray-400 hover:text-blue-600 p-1">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(treatment.id)} className="text-gray-400 hover:text-red-600 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subclasses */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Sub-clases ({treatment.subclasses?.length || 0}/5)
                      </p>
                    </div>
                    {treatment.subclasses && treatment.subclasses.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {treatment.subclasses.map((sc: any) => (
                          <div key={sc.id} className="bg-gray-50 rounded px-2 py-1 text-sm">
                            <div className="flex items-center justify-between">
                              {editingSubclass?.subclassId === sc.id ? (
                                <form
                                  className="flex items-center gap-1 flex-1"
                                  onSubmit={(e) => {
                                    e.preventDefault()
                                    if (editingSubclass!.name.trim()) {
                                      updateSubclassMutation.mutate({
                                        treatmentId: treatment.id,
                                        subclassId: sc.id,
                                        name: editingSubclass!.name.trim(),
                                      })
                                    }
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={editingSubclass!.name}
                                    onChange={(e) => setEditingSubclass({ ...editingSubclass!, treatmentId: editingSubclass!.treatmentId, subclassId: editingSubclass!.subclassId, name: e.target.value })}
                                    className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button type="submit" className="text-green-600 hover:text-green-700 text-xs font-medium">OK</button>
                                  <button type="button" onClick={() => setEditingSubclass(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancelar</button>
                                </form>
                              ) : (
                                <>
                                  <span className="text-gray-700">{sc.name}</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setEditingSubclass({ treatmentId: treatment.id, subclassId: sc.id, name: sc.name })}
                                      className="text-gray-400 hover:text-blue-600"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteSubclassMutation.mutate({ treatmentId: treatment.id, subclassId: sc.id })}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(!treatment.subclasses || treatment.subclasses.length < 5) && (
                      <form
                        className="flex items-center gap-1"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const name = (subclassInput[treatment.id] || '').trim()
                          if (name) {
                            createSubclassMutation.mutate({ treatmentId: treatment.id, name })
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={subclassInput[treatment.id] || ''}
                          onChange={(e) => setSubclassInput({ ...subclassInput, [treatment.id]: e.target.value })}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                          placeholder="Nueva sub-clase..."
                          maxLength={255}
                        />
                        <button
                          type="submit"
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium"
                          disabled={createSubclassMutation.isPending}
                        >
                          {createSubclassMutation.isPending ? '...' : '+ Agregar'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Sub-sub-clases (options at treatment level) */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Sub-sub-clases ({treatment.options?.length || 0}/10)
                      </p>
                    </div>
                    {treatment.options && treatment.options.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {treatment.options.map((opt: any) => (
                          <div key={opt.id} className="flex items-center justify-between bg-purple-50 rounded px-2 py-1 text-sm">
                            {editingOption?.optionId === opt.id ? (
                              <form
                                className="flex items-center gap-1 flex-1"
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  if (editingOption!.name.trim()) {
                                    updateOptionMutation.mutate({
                                      treatmentId: treatment.id,
                                      optionId: opt.id,
                                      name: editingOption!.name.trim(),
                                    })
                                  }
                                }}
                              >
                                <input
                                  type="text"
                                  value={editingOption!.name}
                                  onChange={(e) => setEditingOption({ treatmentId: editingOption!.treatmentId, optionId: editingOption!.optionId, name: e.target.value })}
                                  className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-purple-500"
                                  autoFocus
                                />
                                <button type="submit" className="text-green-600 hover:text-green-700 text-xs font-medium">OK</button>
                                <button type="button" onClick={() => setEditingOption(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cancelar</button>
                              </form>
                            ) : (
                              <>
                                <span className="text-gray-700">{opt.name}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setEditingOption({ treatmentId: treatment.id, optionId: opt.id, name: opt.name })}
                                    className="text-gray-400 hover:text-blue-600"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteOptionMutation.mutate({ treatmentId: treatment.id, optionId: opt.id })}
                                    className="text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {(!treatment.options || treatment.options.length < 10) && (
                      <form
                        className="flex items-center gap-1"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const name = (optionInput[treatment.id] || '').trim()
                          if (name) {
                            createOptionMutation.mutate({ treatmentId: treatment.id, name })
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={optionInput[treatment.id] || ''}
                          onChange={(e) => setOptionInput({ ...optionInput, [treatment.id]: e.target.value })}
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500"
                          placeholder="Nueva sub-sub-clase..."
                          maxLength={255}
                        />
                        <button
                          type="submit"
                          className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded font-medium"
                          disabled={createOptionMutation.isPending}
                        >
                          {createOptionMutation.isPending ? '...' : '+ Agregar'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay tratamientos registrados para esta cátedra</p>
              <button onClick={openCreate} className="mt-4 btn btn-primary btn-sm">
                Agregar Primer Tratamiento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Treatment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTreatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Ej: Exodoncia Simple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    required
                    maxLength={20}
                    placeholder="Ej: CIR-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sesiones estimadas</label>
                  <input
                    type="number"
                    min={0}
                    value={form.estimated_sessions}
                    onChange={e => setForm({ ...form, estimated_sessions: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio base</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.base_price}
                    onChange={e => setForm({ ...form, base_price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-gray-700">Opciones de diente</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires-tooth"
                    checked={form.requires_tooth}
                    onChange={e => setForm({ ...form, requires_tooth: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="requires-tooth" className="text-sm text-gray-700">Requiere especificar diente</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="all-upper"
                    checked={form.applies_to_all_upper}
                    onChange={e => setForm({ ...form, applies_to_all_upper: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="all-upper" className="text-sm text-gray-700 flex items-center gap-1">
                    <ArrowUpFromLine className="h-4 w-4 text-indigo-500" />
                    Puede ocupar todos los dientes de la línea superior
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="all-lower"
                    checked={form.applies_to_all_lower}
                    onChange={e => setForm({ ...form, applies_to_all_lower: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="all-lower" className="text-sm text-gray-700 flex items-center gap-1">
                    <ArrowDownFromLine className="h-4 w-4 text-indigo-500" />
                    Puede ocupar todos los dientes de la línea inferior
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="treatment-active"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="treatment-active" className="text-sm text-gray-700">Tratamiento activo</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : editingTreatment ? 'Guardar Cambios' : 'Crear Tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar tratamiento?</h3>
            <p className="text-slate-600 text-sm mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline flex-1">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
