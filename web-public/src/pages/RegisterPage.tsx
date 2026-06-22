import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    birth_date: '',
    university_id: '',
  })
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => (await api.universities.list()).data.data,
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (!acceptPrivacy) {
      setError('Debés aceptar la política de privacidad.')
      return
    }

    setLoading(true)
    try {
      await api.auth.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        birth_date: form.birth_date || null,
        university_id: form.university_id ? Number(form.university_id) : null,
      })

      // Auto-login tras registro para llevar al usuario a su perfil.
      await login(form.email, form.password)
      navigate('/perfil')
    } catch (err: any) {
      const data = err.response?.data
      const validation = data?.errors
        ? Object.values(data.errors).flat().join(' ')
        : null
      setError(validation || data?.message || 'No se pudo completar el registro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="field-label" htmlFor="name">Nombre completo</label>
          <input id="name" className="field-input" value={form.name}
            onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div>
          <label className="field-label" htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="email" className="field-input"
            value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </div>

        <div>
          <label className="field-label" htmlFor="phone">Teléfono</label>
          <input id="phone" className="field-input" value={form.phone}
            onChange={(e) => set('phone', e.target.value)} required />
        </div>

        <div>
          <label className="field-label" htmlFor="birth_date">Fecha de nacimiento</label>
          <input id="birth_date" type="date" className="field-input" value={form.birth_date}
            onChange={(e) => set('birth_date', e.target.value)} />
        </div>

        <div>
          <label className="field-label" htmlFor="university">Universidad</label>
          <select id="university" className="field-input" value={form.university_id}
            onChange={(e) => set('university_id', e.target.value)}>
            <option value="">Seleccioná (opcional)</option>
            {universities?.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="password">Contraseña</label>
            <input id="password" type="password" autoComplete="new-password" className="field-input"
              value={form.password} onChange={(e) => set('password', e.target.value)} required />
          </div>
          <div>
            <label className="field-label" htmlFor="passwordConfirm">Repetir contraseña</label>
            <input id="passwordConfirm" type="password" autoComplete="new-password" className="field-input"
              value={form.passwordConfirm} onChange={(e) => set('passwordConfirm', e.target.value)} required />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)} />
          <span>
            Acepto la{' '}
            <a href="https://codexpy.com/odontopacientes/privacidad.html" target="_blank"
              rel="noreferrer" className="text-brand-turquoise hover:underline">
              política de privacidad
            </a>.
          </span>
        </label>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="text-center text-sm text-slate-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-turquoise hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
