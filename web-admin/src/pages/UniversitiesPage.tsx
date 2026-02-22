import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, GraduationCap, Loader2, Edit2, Trash2, X, Globe, Mail, Phone, MapPin } from 'lucide-react'
import { api } from '@/lib/api'

interface UniversityForm {
  name: string
  code: string
  address: string
  phone: string
  email: string
  website: string
}

const emptyForm: UniversityForm = {
  name: '', code: '', address: '', phone: '', email: '', website: '',
}

export default function UniversitiesPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<UniversityForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data: uniData, isLoading } = useQuery({
    queryKey: ['universities'],
    queryFn: () => api.universities.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.universities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.universities.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.universities.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] })
      setDeleteConfirm(null)
    },
  })

  const universities = Array.isArray(uniData?.data?.data) ? uniData.data.data : []

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (u: any) => {
    setEditing(u)
    setForm({
      name: u.name || '',
      code: u.code || '',
      address: u.address || '',
      phone: u.phone || '',
      email: u.email || '',
      website: u.website || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form })
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
          <h1 className="text-3xl font-bold text-slate-900">Universidades</h1>
          <p className="text-slate-600 mt-1">Gestión de universidades del sistema</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nueva Universidad
        </button>
      </div>

      {universities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No hay universidades</h3>
          <p className="text-gray-500 mt-1">Agrega la primera universidad al sistema</p>
          <button onClick={openCreate} className="btn btn-primary mt-4">
            <Plus className="h-4 w-4 mr-2 inline" /> Crear Universidad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((uni: any) => (
            <div key={uni.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-2 bg-blue-600" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-slate-900">{uni.name}</h3>
                      <p className="text-sm text-slate-500 font-mono">{uni.code}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {uni.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{uni.address}</span>
                    </div>
                  )}
                  {uni.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{uni.phone}</span>
                    </div>
                  )}
                  {uni.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{uni.email}</span>
                    </div>
                  )}
                  {uni.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href={uni.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {uni.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                  <button onClick={() => openEdit(uni)} className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(uni.id)}
                    className="btn btn-sm text-red-600 hover:bg-red-50 border border-red-200 px-3"
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
                {editing ? 'Editar Universidad' : 'Nueva Universidad'}
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
                  placeholder="Ej: Universidad Nacional de Asunción"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  required
                  maxLength={10}
                  placeholder="Ej: UNA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : editing ? 'Guardar Cambios' : 'Crear Universidad'}
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar universidad?</h3>
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
