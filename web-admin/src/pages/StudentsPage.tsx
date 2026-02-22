import { useState, useEffect } from 'react'
import { Search, Plus, GraduationCap, Mail, Phone, Calendar, Building2, X, Camera, User } from 'lucide-react'
import { apiClient } from '../lib/api'

interface Student {
  id: number
  name: string
  email: string
  phone: string | null
  role: 'alumno'
  active: boolean
  birth_date: string | null
  profile_image: string | null
  university_id: number | null
  university: { id: number; name: string } | null
  created_at: string
}

const emptyForm = { name: '', email: '', password: '', phone: '', birth_date: '', university_id: '' }

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([])

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', birth_date: '', university_id: '', active: true, profile_image: '' })
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchUniversities()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/users')
      const all = response.data.data || []
      setStudents(all.filter((u: any) => u.role === 'alumno'))
      setError('')
    } catch {
      setError('Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const fetchUniversities = async () => {
    try {
      const response = await apiClient.get('/universities')
      setUniversities(response.data.data || [])
    } catch {}
  }

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Nombre, email y contraseña son obligatorios')
      return
    }
    try {
      setCreating(true)
      setCreateError('')
      const response = await apiClient.post('/users', {
        ...createForm,
        role: 'alumno',
        university_id: createForm.university_id ? Number(createForm.university_id) : null,
      })
      setStudents([response.data.data, ...students])
      setShowCreate(false)
      setCreateForm(emptyForm)
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Error al crear estudiante')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      birth_date: student.birth_date || '',
      university_id: student.university_id ? String(student.university_id) : '',
      active: student.active,
      profile_image: student.profile_image || '',
    })
    setImagePreview(student.profile_image)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const b64 = reader.result as string
        setImagePreview(b64)
        setEditForm(f => ({ ...f, profile_image: b64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!editingStudent) return
    try {
      setSaving(true)
      const response = await apiClient.put(`/users/${editingStudent.id}`, {
        ...editForm,
        role: 'alumno',
        university_id: editForm.university_id ? Number(editForm.university_id) : null,
      })
      setStudents(students.map(s => s.id === editingStudent.id ? response.data.data : s))
      setEditingStudent(null)
      setImagePreview(null)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (student: Student) => {
    try {
      const response = await apiClient.put(`/users/${student.id}/toggle-active`)
      setStudents(students.map(s => s.id === student.id ? response.data.data : s))
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alumnos</h1>
          <p className="text-slate-600 mt-1">Usuarios con rol Alumno registrados en el sistema</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateForm(emptyForm); setCreateError('') }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Alumno
        </button>
      </div>

      {/* Search */}
      <div className="card card-body">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* States */}
      {loading && <div className="text-center py-12 text-slate-600">Cargando estudiantes...</div>}
      {error && <div className="card card-body bg-red-50 border-red-200"><p className="text-red-800">{error}</p></div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="card card-body text-center py-12">
          <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No se encontraron estudiantes</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && filtered.map(student => (
          <div key={student.id} className="card card-body">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {student.profile_image
                    ? <img src={student.profile_image} className="h-12 w-12 rounded-full object-cover" />
                    : <GraduationCap className="h-6 w-6 text-primary-600" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{student.name}</h3>
                  <p className="text-xs text-slate-500">ID #{student.id}</p>
                </div>
              </div>
              <span className={`badge ${student.active ? 'badge-green' : 'badge-gray'}`}>
                {student.active ? 'activo' : 'inactivo'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  {student.phone}
                </div>
              )}
              {student.university && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  {student.university.name}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                Registrado: {new Date(student.created_at).toLocaleDateString('es-PY')}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
              <button onClick={() => handleEdit(student)} className="btn btn-outline btn-sm flex-1">Editar</button>
              <button onClick={() => handleToggleActive(student)} className="btn btn-primary btn-sm flex-1">
                {student.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Nuevo Alumno</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}
              <div>
                <label className="label">Nombre completo *</label>
                <input type="text" className="input" placeholder="Ej: Juan Pérez"
                  value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Correo electrónico *</label>
                <input type="email" className="input" placeholder="alumno@ejemplo.com"
                  value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input type="password" className="input" placeholder="Mínimo 6 caracteres"
                  value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="text" className="input" placeholder="Ej: 0981 123 456"
                  value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input type="date" className="input"
                  value={createForm.birth_date} onChange={e => setCreateForm({ ...createForm, birth_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Universidad</label>
                <select className="input" value={createForm.university_id}
                  onChange={e => setCreateForm({ ...createForm, university_id: e.target.value })}>
                  <option value="">Sin universidad</option>
                  {universities.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowCreate(false)} className="btn btn-outline flex-1" disabled={creating}>Cancelar</button>
              <button onClick={handleCreate} className="btn btn-primary flex-1" disabled={creating}>
                {creating ? 'Creando...' : 'Crear Alumno'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Editar Estudiante</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Nombre completo</label>
                <input type="text" className="input" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Correo electrónico</label>
                <input type="email" className="input" value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input type="text" className="input" value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input type="date" className="input" value={editForm.birth_date}
                  onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })} />
              </div>
              <div>
                <label className="label">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  {imagePreview
                    ? <img src={imagePreview} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                    : <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                        <User className="h-8 w-8 text-slate-400" />
                      </div>}
                  <div>
                    <input type="file" id="student-img" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <label htmlFor="student-img" className="btn btn-outline btn-sm cursor-pointer inline-flex items-center gap-2">
                      <Camera className="h-4 w-4" /> Cargar
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Universidad</label>
                <select className="input" value={editForm.university_id}
                  onChange={e => setEditForm({ ...editForm, university_id: e.target.value })}>
                  <option value="">Sin universidad</option>
                  {universities.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="student-active" className="h-4 w-4 text-primary-600 border-slate-300 rounded"
                  checked={editForm.active} onChange={e => setEditForm({ ...editForm, active: e.target.checked })} />
                <label htmlFor="student-active" className="text-sm text-slate-700">Usuario activo</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setEditingStudent(null)} className="btn btn-outline flex-1" disabled={saving}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary flex-1" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
