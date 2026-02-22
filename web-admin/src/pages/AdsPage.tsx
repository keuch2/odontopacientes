import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Megaphone, Edit2, Trash2, X, ExternalLink, Eye, MousePointer, Upload } from 'lucide-react'
import { apiClient } from '../lib/api'

interface Ad {
  id: number
  title: string
  image_url: string
  link_url: string | null
  position: 'dashboard_banner' | 'sidebar' | 'popup'
  active: boolean
  order: number
  start_date: string | null
  end_date: string | null
  clicks: number
  impressions: number
  created_at: string
  updated_at: string
}

const positionLabels: Record<Ad['position'], string> = {
  dashboard_banner: 'Banner Dashboard',
  sidebar: 'Sidebar',
  popup: 'Popup'
}

const positionColors: Record<Ad['position'], string> = {
  dashboard_banner: 'bg-blue-100 text-blue-800',
  sidebar: 'bg-green-100 text-green-800',
  popup: 'bg-purple-100 text-purple-800'
}

export default function AdsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'dashboard_banner' as Ad['position'],
    active: true,
    order: 0,
    start_date: '',
    end_date: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/ads')
      setAds(response.data.data || [])
      setError('')
    } catch (err: any) {
      console.error('Error fetching ads:', err)
      setError('Error al cargar anuncios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingAd(null)
    setEditForm({
      title: '',
      image_url: '',
      link_url: '',
      position: 'dashboard_banner',
      active: true,
      order: 0,
      start_date: '',
      end_date: ''
    })
  }

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad)
    setIsCreating(false)
    setEditForm({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      position: ad.position,
      active: ad.active,
      order: ad.order,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : ''
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const payload = {
        ...editForm,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        link_url: editForm.link_url || null
      }

      if (isCreating) {
        const response = await apiClient.post('/ads', payload)
        setAds([...ads, response.data.data])
      } else if (editingAd) {
        const response = await apiClient.put(`/ads/${editingAd.id}`, payload)
        setAds(ads.map(a => a.id === editingAd.id ? response.data.data : a))
      }
      
      setEditingAd(null)
      setIsCreating(false)
    } catch (err: any) {
      console.error('Error saving ad:', err)
      alert('Error al guardar el anuncio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return
    
    try {
      await apiClient.delete(`/ads/${id}`)
      setAds(ads.filter(a => a.id !== id))
    } catch (err: any) {
      console.error('Error deleting ad:', err)
      alert('Error al eliminar el anuncio')
    }
  }

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const response = await apiClient.post('/ads/upload-image', { image: base64 })
      setEditForm({ ...editForm, image_url: response.data.data.url })
    } catch (err: any) {
      console.error('Error uploading image:', err)
      alert('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleActive = async (ad: Ad) => {
    try {
      const response = await apiClient.put(`/ads/${ad.id}`, { active: !ad.active })
      setAds(ads.map(a => a.id === ad.id ? response.data.data : a))
    } catch (err: any) {
      console.error('Error toggling ad:', err)
    }
  }

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPosition = !selectedPosition || ad.position === selectedPosition
    return matchesSearch && matchesPosition
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Publicidad</h1>
          <p className="mt-1 text-sm text-slate-600">
            Administra los banners publicitarios de la aplicación móvil
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Anuncio
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Todas las posiciones</option>
          <option value="dashboard_banner">Banner Dashboard</option>
          <option value="sidebar">Sidebar</option>
          <option value="popup">Popup</option>
        </select>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map((ad) => (
          <div key={ad.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Image Preview */}
            <div className="relative h-40 bg-slate-100">
              {ad.image_url ? (
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Megaphone className="h-12 w-12" />
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  ad.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {ad.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 truncate">{ad.title}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${positionColors[ad.position]}`}>
                    {positionLabels[ad.position]}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{ad.impressions}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MousePointer className="h-4 w-4" />
                  <span>{ad.clicks}</span>
                </div>
                {ad.link_url && (
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Dates */}
              {(ad.start_date || ad.end_date) && (
                <div className="mt-2 text-xs text-slate-500">
                  {ad.start_date && <span>Desde: {new Date(ad.start_date).toLocaleDateString()}</span>}
                  {ad.start_date && ad.end_date && <span className="mx-1">-</span>}
                  {ad.end_date && <span>Hasta: {new Date(ad.end_date).toLocaleDateString()}</span>}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(ad)}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md ${
                    ad.active
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {ad.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleEdit(ad)}
                  className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-md"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAds.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <Megaphone className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No hay anuncios</h3>
          <p className="mt-1 text-sm text-slate-500">
            Comienza creando un nuevo anuncio para la app.
          </p>
          <button
            onClick={handleCreate}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Anuncio
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {(editingAd || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">
                {isCreating ? 'Nuevo Anuncio' : 'Editar Anuncio'}
              </h2>
              <button
                onClick={() => { setEditingAd(null); setIsCreating(false) }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ej: Banner Itaú"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Imagen del Banner *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    await handleImageUpload(file)
                  }}
                />
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file && file.type.startsWith('image/')) {
                      await handleImageUpload(file)
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-500">Subiendo imagen...</p>
                    </div>
                  ) : editForm.image_url ? (
                    <div className="relative">
                      <img
                        src={editForm.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <p className="mt-2 text-xs text-slate-500">Click o arrastra para cambiar la imagen</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="mt-2 text-sm text-slate-600">Click o arrastra una imagen aquí</p>
                      <p className="text-xs text-slate-400">PNG, JPG, WEBP (máx. 5MB)</p>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-700">O pegar URL directamente</summary>
                    <input
                      type="text"
                      value={editForm.image_url}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </details>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL de Destino (opcional)
                </label>
                <input
                  type="text"
                  value={editForm.link_url}
                  onChange={(e) => setEditForm({ ...editForm, link_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://ejemplo.com/landing"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Posición
                  </label>
                  <select
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value as Ad['position'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="dashboard_banner">Banner Dashboard</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={editForm.order}
                    onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="active" className="ml-2 text-sm text-slate-700">
                  Anuncio activo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-slate-50">
              <button
                onClick={() => { setEditingAd(null); setIsCreating(false) }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.title || !editForm.image_url}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
