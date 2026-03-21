import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, ClipboardList, Loader2, Edit2, Trash2, X, Upload,
  Scissors, HeartPulse, Bone, Syringe, Microscope,
  ShieldCheck, ScanFace, Baby, Paintbrush, Wrench, Circle,
  Smartphone,
} from 'lucide-react'
import { api } from '@/lib/api'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'clipboard-list': ClipboardList,
  'scissors': Scissors,
  'heart-pulse': HeartPulse,
  'bone': Bone,
  'syringe': Syringe,
  'microscope': Microscope,
  'tooth': Circle,
  'shield-check': ShieldCheck,
  'scan-face': ScanFace,
  'baby': Baby,
  'paintbrush': Paintbrush,
  'wrench': Wrench,
}

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

// Mobile preview component - simulates how the chair card looks in the app
function MobilePreview({ color, iconUrl, iconPreviewUrl, name }: { color: string; iconUrl?: string; iconPreviewUrl?: string; name: string }) {
  const previewSrc = iconPreviewUrl || iconUrl
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="h-4 w-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vista previa en la app</span>
      </div>
      <div className="flex justify-center">
        <div
          className="w-36 h-36 rounded-xl flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: color || '#6366F1' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="Ícono" className="w-10 h-10 object-contain" />
            ) : (
              <ClipboardList className="w-10 h-10 text-white/80" />
            )}
          </div>
          <span className="text-white font-semibold text-sm text-center px-2 leading-tight">
            {name || 'Cátedra'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ChairsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingChair, setEditingChair] = useState<any>(null)
  const [form, setForm] = useState<ChairForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null)
  const [existingIconUrl, setExistingIconUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: chairsData, isLoading } = useQuery({
    queryKey: ['chairs'],
    queryFn: () => api.chairs.getAll({ include_inactive: true }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.chairs.create(data),
    onSuccess: async (response) => {
      const chairId = response.data?.data?.id
      if (iconFile && chairId) {
        await api.chairs.uploadIcon(chairId, iconFile)
      }
      queryClient.invalidateQueries({ queryKey: ['chairs'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.chairs.update(id, data),
    onSuccess: async () => {
      if (iconFile && editingChair) {
        await api.chairs.uploadIcon(editingChair.id, iconFile)
      }
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

  const deleteIconMutation = useMutation({
    mutationFn: (id: number) => api.chairs.deleteIcon(id),
    onSuccess: () => {
      setExistingIconUrl(null)
      queryClient.invalidateQueries({ queryKey: ['chairs'] })
    },
  })

  const chairs = Array.isArray(chairsData?.data?.data) ? chairsData.data.data : []

  const openCreate = () => {
    setEditingChair(null)
    setForm(emptyForm)
    setIconFile(null)
    setIconPreviewUrl(null)
    setExistingIconUrl(null)
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
    setIconFile(null)
    setIconPreviewUrl(null)
    setExistingIconUrl(chair.icon_url || null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingChair(null)
    setForm(emptyForm)
    setIconFile(null)
    setIconPreviewUrl(null)
    setExistingIconUrl(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIconFile(file)
      const url = URL.createObjectURL(file)
      setIconPreviewUrl(url)
    }
  }

  const handleRemoveCustomIcon = () => {
    setIconFile(null)
    setIconPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (editingChair && existingIconUrl) {
      deleteIconMutation.mutate(editingChair.id)
    }
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

  // Determine what icon is currently active for preview
  const hasCustomIcon = !!iconPreviewUrl || !!existingIconUrl

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
                      className="h-12 w-12 rounded-lg flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: chair.color || '#6366F1' }}
                    >
                      {chair.icon_url ? (
                        <img src={chair.icon_url} alt="" className="h-7 w-7 object-contain" />
                      ) : (() => { const IC = ICON_MAP[chair.icon]; return IC ? <IC className="h-6 w-6 text-white" /> : <ClipboardList className="h-6 w-6 text-white" /> })()}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">
                {editingChair ? 'Editar Cátedra' : 'Nueva Cátedra'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left column - Form fields */}
                <div className="lg:col-span-3 space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ícono personalizado</label>
                    {hasCustomIcon ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: form.color || '#6366F1' }}
                        >
                          <img
                            src={iconPreviewUrl || existingIconUrl || ''}
                            alt="Ícono"
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {iconFile ? iconFile.name : 'Ícono personalizado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {iconFile ? `${(iconFile.size / 1024).toFixed(1)} KB` : 'Subido anteriormente'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCustomIcon}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar ícono"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="text-sm font-medium">Subir ícono (PNG, JPG, SVG, WebP)</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {!hasCustomIcon && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">O elegir ícono predefinido</label>
                      <div className="grid grid-cols-4 gap-2">
                        {ICON_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm({ ...form, icon: opt.value })}
                            className={`p-2 rounded-lg border text-center text-xs transition-colors flex flex-col items-center gap-1 ${
                              form.icon === opt.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            {(() => { const IconComp = ICON_MAP[opt.value]; return IconComp ? <IconComp className="h-5 w-5" /> : null })()}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                </div>

                {/* Right column - Mobile Preview */}
                <div className="lg:col-span-2">
                  <MobilePreview
                    color={form.color}
                    iconUrl={existingIconUrl || undefined}
                    iconPreviewUrl={iconPreviewUrl || undefined}
                    name={form.name}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t">
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
