import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, Loader2, Edit2, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'

const ICON_OPTIONS = [
  { value: 'clipboard-list', label: 'Portapapeles' },
  { value: 'scissors', label: 'Cirugía' },
  { value: 'heart-pulse', label: 'Cardiología' },
  { value: 'bone', label: 'Hueso' },
  { value: 'syringe', label: 'Jeringa' },
  { value: 'microscope', label: 'Microscopio' },
  { value: 'tooth', label: 'Diente' },
  { value: 'shield-check', label: 'Prevención' },
  { value: 'scan-face', label: 'Radiología' },
  { value: 'baby', label: 'Pediátrico' },
  { value: 'paintbrush', label: 'Estética' },
  { value: 'wrench', label: 'Prótesis' },
]

const COLOR_PRESETS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#EC4899', '#F43F5E',
]

interface ChairForm {
  name: string
  key: string
  color: string
  icon: string
  description: string
  active: boolean
}

const emptyForm: ChairForm = {
  name: '', key: '', color: '#6366F1', icon: 'clipboard-list', description: '', active: true,
}

export default function ChairsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingChair, setEditingChair] = useState<any>(null)
  const [form, setForm] = useState<ChairForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data: chairsData, isLoading } = useQuery({
    queryKey: ['chairs'],
    queryFn: () => api.chairs.getAll({ include_inactive: true }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.chairs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chairs'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.chairs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chairs'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.chairs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chairs'] })
      setDeleteConfirm(null)
    },
  })

  const chairs = Array.isArray(chairsData?.data?.data) ? chairsData.data.data : []

  const openCreate = () => {
    setEditingChair(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (chair: any) => {
    setEditingChair(chair)
    setForm({
      name: chair.name || '',
      key: chair.key || '',
      color: chair.color || '#6366F1',
      icon: chair.icon || 'clipboard-list',
      description: chair.description || '',
      active: chair.active ?? true,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingChair(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingChair) {
      updateMutation.mutate({ id: editingChair.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cátedras</h1>
          <p className="text-slate-600 mt-1">Gestión de cátedras y tratamientos asociados</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nueva Cátedra
        </button>
      </div>

      {chairs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No hay cátedras</h3>
          <p className="text-gray-500 mt-1">Crea la primera cátedra para comenzar</p>
          <button onClick={openCreate} className="btn btn-primary mt-4">
            <Plus className="h-4 w-4 mr-2 inline" /> Crear Cátedra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chairs.map((chair: any) => (
            <div key={chair.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-2" style={{ backgroundColor: chair.color || '#6366F1' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: chair.color || '#6366F1' }}
                    >
                      <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-slate-900">{chair.name}</h3>
                      <p className="text-sm text-slate-500">
                        {chair.treatments_count || 0} tratamientos
                        {!chair.active && <span className="ml-2 text-red-500 font-medium">(Inactiva)</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {chair.description && (
                  <p className="text-sm text-slate-600 mb-3">{chair.description}</p>
                )}

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Tratamientos</h4>
                  <div className="space-y-1">
                    {chair.treatments && chair.treatments.length > 0 ? (
                      <>
                        {chair.treatments.slice(0, 3).map((t: any) => (
                          <div key={t.id} className="text-sm text-slate-600 flex items-center">
                            <span
                              className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                              style={{ backgroundColor: chair.color || '#6366F1' }}
                            />
                            {t.name}
                          </div>
                        ))}
                        {chair.treatments.length > 3 && (
                          <button
                            onClick={() => navigate(`/chairs/${chair.id}`)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Ver todos ({chair.treatments.length})
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Sin tratamientos</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                  <button onClick={() => openEdit(chair)} className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => navigate(`/chairs/${chair.id}`)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Ver Detalle
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(chair.id)}
                    className="btn btn-sm text-red-600 hover:bg-red-50 border border-red-200 px-2"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingChair ? 'Editar Cátedra' : 'Nueva Cátedra'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Ej: Cirugía Bucal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clave (key) *</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={e => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  maxLength={20}
                  placeholder="Ej: cirugia-bucal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Descripción de la cátedra..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                        form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                    title="Color personalizado"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
                <div className="grid grid-cols-4 gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, icon: opt.value })}
                      className={`p-2 rounded-lg border text-center text-xs transition-colors ${
                        form.icon === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chair-active"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="chair-active" className="text-sm text-gray-700">Cátedra activa</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : editingChair ? 'Guardar Cambios' : 'Crear Cátedra'}
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar cátedra?</h3>
            <p className="text-slate-600 text-sm mb-4">
              Esta acción eliminará la cátedra y todos sus tratamientos. No se puede deshacer.
            </p>
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
