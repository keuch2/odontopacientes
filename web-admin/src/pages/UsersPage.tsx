import { useState, useEffect } from 'react'
import { Search, Plus, Shield, User, Mail, Phone, X, Camera } from 'lucide-react'
import { apiClient } from '../lib/api'

interface SystemUser {
  id: number
  name: string
  email: string
  phone: string
  role: 'admin' | 'coordinador' | 'admision' | 'alumno'
  active: boolean
  birth_date: string | null
  profile_image: string | null
  university_id: number | null
  university: { id: number; name: string } | null
  created_at: string
  updated_at: string
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-800',
  coordinador: 'bg-blue-100 text-blue-800',
  admision: 'bg-green-100 text-green-800',
  alumno: 'bg-slate-100 text-slate-800'
}

const roleLabels: Record<SystemUser['role'], string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  admision: 'Admisión',
  alumno: 'Alumno'
}

const emptyCreateForm = { name: '', email: '', password: '', phone: '', role: 'alumno' as SystemUser['role'], birth_date: '', university_id: '' as string }

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estado para modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Estado para modal de edición
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'alumno' as SystemUser['role'], active: true, birth_date: '', profile_image: '', university_id: '' as string })
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetchUsers()
    fetchUniversities()
  }, [])

  const fetchUniversities = async () => {
    try {
      const response = await apiClient.get('/universities')
      setUniversities(response.data.data || [])
    } catch (err) {
      console.error('Error fetching universities:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/users')
      setUsers(response.data.data || [])
      setError('')
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Nombre, email y contraseña son obligatorios')
      return
    }
    try {
      setCreating(true)
      setCreateError('')
      const payload = {
        ...createForm,
        university_id: createForm.university_id ? Number(createForm.university_id) : null,
      }
      const response = await apiClient.post('/users', payload)
      setUsers([response.data.data, ...users])
      setShowCreateModal(false)
      setCreateForm(emptyCreateForm)
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Error al crear usuario')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      active: user.active,
      birth_date: user.birth_date || '',
      profile_image: user.profile_image || '',
      university_id: user.university_id ? String(user.university_id) : '',
    })
    setImagePreview(user.profile_image)
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setEditForm(prevForm => ({ ...prevForm, profile_image: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSave = async () => {
    if (!editingUser) return
    
    try {
      setSaving(true)
      const payload = {
        ...editForm,
        university_id: editForm.university_id ? Number(editForm.university_id) : null,
      }
      const response = await apiClient.put(`/users/${editingUser.id}`, payload)
      
      console.log('Response from server:', response.data.data)
      
      // Actualizar la lista de usuarios
      setUsers(users.map(u => u.id === editingUser.id ? response.data.data : u))
      setEditingUser(null)
      setImagePreview(null)
    } catch (err: any) {
      console.error('Error updating user:', err)
      alert('Error al actualizar usuario: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }
  
  const handleToggleActive = async (user: SystemUser) => {
    try {
      const response = await apiClient.put(`/users/${user.id}/toggle-active`)
      
      // Actualizar la lista de usuarios
      setUsers(users.map(u => u.id === user.id ? response.data.data : u))
    } catch (err: any) {
      console.error('Error toggling user active:', err)
      alert('Error al cambiar estado: ' + (err.response?.data?.message || err.message))
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !selectedRole || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuarios del Sistema</h1>
          <p className="text-slate-600 mt-1">Gestión de usuarios y permisos</p>
        </div>
        <button onClick={() => { setShowCreateModal(true); setCreateForm(emptyCreateForm); setCreateError('') }} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="card card-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="alumno">Alumno</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-slate-600">Cargando usuarios...</p>
        </div>
      )}

      {error && (
        <div className="card card-body bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">No se encontraron usuarios</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!loading && filteredUsers.map((user) => (
          <div key={user.id} className="card card-body">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
                <span className={`badge ${user.active ? 'badge-green' : 'badge-gray'}`}>
                  {user.active ? 'activo' : 'inactivo'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center text-sm text-slate-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {user.phone}
                </div>
              )}
              {(user as any).university && (
                <div className="flex items-center text-sm text-slate-600">
                  <Shield className="h-4 w-4 mr-2" />
                  {(user as any).university.name}
                </div>
              )}
              <div className="flex items-center text-sm text-slate-600">
                <Shield className="h-4 w-4 mr-2" />
                Registrado: {new Date(user.created_at).toLocaleDateString('es-PY')}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
              <button onClick={() => handleEdit(user)} className="btn btn-outline btn-sm flex-1">Editar</button>
              <button onClick={() => handleToggleActive(user)} className="btn btn-primary btn-sm flex-1">
                {user.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Nuevo Usuario</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
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
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Juan Pérez"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Correo electrónico *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="usuario@ejemplo.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Contraseña *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Teléfono</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: 0981 123 456"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="input"
                  value={createForm.birth_date}
                  onChange={(e) => setCreateForm({ ...createForm, birth_date: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Universidad</label>
                <select
                  className="input"
                  value={createForm.university_id}
                  onChange={(e) => setCreateForm({ ...createForm, university_id: e.target.value })}
                >
                  <option value="">Sin universidad</option>
                  {universities.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Rol *</label>
                <select
                  className="input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as SystemUser['role'] })}
                >
                  <option value="alumno">Alumno</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline flex-1"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="btn btn-primary flex-1"
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Editar Usuario</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Nombre completo</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Correo electrónico</label>
                <input
                  type="email"
                  className="input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="input"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Imagen de perfil</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <User className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profile-image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="btn btn-outline cursor-pointer inline-flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Cargar imagen
                    </label>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG o GIF (máx. 2MB)</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="label">Universidad</label>
                <select
                  className="input"
                  value={editForm.university_id}
                  onChange={(e) => setEditForm({ ...editForm, university_id: e.target.value })}
                >
                  <option value="">Sin universidad</option>
                  {universities.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Rol</label>
                <select
                  className="input"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as SystemUser['role'] })}
                >
                  <option value="alumno">Alumno</option>
                  <option value="admin">Administrador</option>
                </select>

              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                />
                <label htmlFor="active" className="ml-2 block text-sm text-slate-700">
                  Usuario activo
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setEditingUser(null)}
                className="btn btn-outline flex-1"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary flex-1"
                disabled={saving}
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
