import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const response = await api.auth.resetPassword({
        email,
        token,
        password,
        password_confirmation: confirmation,
      })
      setMessage(response.data.message ?? '')
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Nueva contraseña</h1>
      {message ? (
        <div className="card space-y-4 text-center">
          <p className="text-slate-700">{message}</p>
          <Link to="/login" className="font-semibold text-brand-turquoise hover:underline">
            Iniciar sesión
          </Link>
        </div>
      ) : !token || !email ? (
        <div className="card space-y-4 text-center">
          <p className="text-slate-700">El enlace no es válido.</p>
          <Link to="/recuperar-contrasena" className="font-semibold text-brand-turquoise hover:underline">
            Solicitar un enlace nuevo
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}{' '}
              {error.includes('venció') && (
                <Link to="/recuperar-contrasena" className="font-semibold underline">
                  Solicitar otro enlace
                </Link>
              )}
            </div>
          )}
          <p className="text-sm text-slate-600">Cuenta: {email}</p>
          <div>
            <label className="field-label" htmlFor="password">Nueva contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="confirmation">Confirmar contraseña</label>
            <input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="field-input"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </div>
  )
}
