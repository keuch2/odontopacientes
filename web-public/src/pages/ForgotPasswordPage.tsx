import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.auth.forgotPassword(email)
      setMessage(response.data.message ?? '')
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo enviar el enlace.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Recuperar contraseña</h1>
      {message ? (
        <div className="card space-y-4 text-center">
          <p className="text-slate-700">{message}</p>
          <Link to="/login" className="font-semibold text-brand-turquoise hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="field-label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
          <p className="text-center text-sm">
            <Link to="/login" className="font-semibold text-brand-turquoise hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
