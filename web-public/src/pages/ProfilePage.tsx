import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, refreshUser, logout } = useAuthStore()

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => (await api.universities.list()).data.data,
  })

  const [form, setForm] = useState({
    name: '',
    phone: '',
    birth_date: '',
    city: '',
    institution: '',
    university_id: '',
    course: '',
    facebook: '',
    instagram: '',
    tiktok: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Cargar datos actuales del usuario en el formulario.
  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name ?? '',
      phone: user.phone ?? '',
      birth_date: user.birth_date ? user.birth_date.slice(0, 10) : '',
      city: user.city ?? '',
      institution: user.institution ?? '',
      university_id: user.university_id ? String(user.university_id) : '',
      course: user.course ?? '',
      facebook: user.facebook ?? '',
      instagram: user.instagram ?? '',
      tiktok: user.tiktok ?? '',
    })
  }, [user])

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      await api.profile.update({
        name: form.name.trim(),
        phone: form.phone || undefined,
        birth_date: form.birth_date || null,
        city: form.city || null,
        institution: form.institution || null,
        university_id: form.university_id ? Number(form.university_id) : null,
        course: form.course || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        tiktok: form.tiktok || null,
      })
      await refreshUser()
      setMessage({ type: 'ok', text: 'Perfil actualizado correctamente.' })
    } catch (err: any) {
      const data = err.response?.data
      const validation = data?.errors ? Object.values(data.errors).flat().join(' ') : null
      setMessage({ type: 'err', text: validation || data?.message || 'No se pudo guardar.' })
    } finally {
      setSaving(false)
    }
  }

  const isPremium = Boolean(user?.is_premium)

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Mi perfil</h1>

      {/* Badge de plan (informativo). En la web sí podemos enlazar a /plan. */}
      <div className={`card flex items-center justify-between ${isPremium ? 'border-brand-turquoise' : ''}`}>
        <div className="flex items-center gap-3">
          <Star className={isPremium ? 'text-brand-turquoise' : 'text-slate-400'} />
          <div>
            <p className="font-semibold text-brand-navy">
              {user?.plan === 'premium' ? 'Plan Premium' : 'Plan Básico'}
            </p>
            <p className="text-sm text-slate-500">
              {isPremium ? 'Acceso completo a la aplicación.' : 'Acceso de solo lectura.'}
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/plan')} className="btn-secondary">
          Ver mi plan
        </button>
      </div>

      {/* Formulario de perfil — mismos campos que la app móvil. */}
      <form onSubmit={handleSave} className="card space-y-4">
        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="field-label">Correo electrónico</label>
          <input className="field-input bg-slate-100" value={user?.email ?? ''} disabled />
        </div>

        <div>
          <label className="field-label" htmlFor="name">Nombre completo</label>
          <input id="name" className="field-input" value={form.name}
            onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="phone">Teléfono</label>
            <input id="phone" className="field-input" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="birth_date">Fecha de nacimiento</label>
            <input id="birth_date" type="date" className="field-input" value={form.birth_date}
              onChange={(e) => set('birth_date', e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="city">Ciudad</label>
            <input id="city" className="field-input" value={form.city}
              onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="course">Curso / Año</label>
            <input id="course" className="field-input" value={form.course}
              onChange={(e) => set('course', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="university">Universidad</label>
          <select id="university" className="field-input" value={form.university_id}
            onChange={(e) => set('university_id', e.target.value)}>
            <option value="">Sin especificar</option>
            {universities?.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="institution">Institución</label>
          <input id="institution" className="field-input" value={form.institution}
            onChange={(e) => set('institution', e.target.value)} />
        </div>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-600">Redes sociales</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="facebook">Facebook</label>
              <input id="facebook" className="field-input" value={form.facebook}
                onChange={(e) => set('facebook', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="instagram">Instagram</label>
              <input id="instagram" className="field-input" value={form.instagram}
                onChange={(e) => set('instagram', e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="tiktok">TikTok</label>
              <input id="tiktok" className="field-input" value={form.tiktok}
                onChange={(e) => set('tiktok', e.target.value)} />
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <DangerZone onDeleted={() => { logout(); navigate('/') }} />
    </div>
  )
}

function DangerZone({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setError('')
    if (confirm !== 'ELIMINAR') {
      setError('Escribí ELIMINAR para confirmar.')
      return
    }
    setLoading(true)
    try {
      await api.account.remove(password)
      onDeleted()
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo eliminar la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card border-red-200">
      <div className="flex items-center gap-2 text-red-700">
        <Trash2 size={18} />
        <h2 className="font-semibold">Eliminar mi cuenta</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Esta acción elimina tu cuenta de forma permanente. No se puede deshacer.
      </p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-danger mt-4">
          Eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="field-label" htmlFor="del-password">Tu contraseña</label>
            <input id="del-password" type="password" className="field-input"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="del-confirm">
              Escribí <span className="font-bold">ELIMINAR</span> para confirmar
            </label>
            <input id="del-confirm" className="field-input"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="btn-danger" disabled={loading}>
              {loading ? 'Eliminando…' : 'Confirmar eliminación'}
            </button>
            <button onClick={() => setOpen(false)} className="btn-secondary" disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
