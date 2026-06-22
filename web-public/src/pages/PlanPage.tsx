import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Plan {
  code: string
  name: string
  amount: number
  currency: string
  period_days: number
}

export default function PlanPage() {
  const { user, refreshUser } = useAuthStore()
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => (await api.subscription.plans()).data,
  })

  const premiumPlan: Plan | undefined = plansData?.data?.find((p: Plan) => p.code === 'premium')
  const isStub: boolean = Boolean(plansData?.is_stub)
  const isPremium = Boolean(user?.is_premium)

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' }) : null

  // Hace polling del estado hasta que la operación quede confirmada.
  const pollStatus = async (processId: string, attempts = 10): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      const res = await api.subscription.status(processId)
      if (res.data.data?.status === 'confirmed') return true
      await new Promise((r) => setTimeout(r, 1500))
    }
    return false
  }

  const handleSubscribe = async () => {
    setMessage(null)
    setProcessing(true)
    try {
      const checkout = await api.subscription.checkout('premium')
      const { process_id, is_stub, iframe_url } = checkout.data.data

      if (!is_stub && iframe_url) {
        // Gateway real: abrir el checkout de Bancard en una pestaña nueva.
        window.open(iframe_url, '_blank', 'noopener')
      }

      // En modo stub la operación se aprueba sola en el primer status().
      const confirmed = await pollStatus(process_id)
      if (confirmed) {
        await refreshUser()
        setMessage({ type: 'ok', text: '¡Listo! Tu plan Premium ya está activo.' })
      } else {
        setMessage({
          type: 'err',
          text: 'No pudimos confirmar el pago todavía. Si completaste el pago, actualizá esta página en unos minutos.',
        })
      }
    } catch (err: any) {
      setMessage({ type: 'err', text: err.response?.data?.message || 'No se pudo iniciar el pago.' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Mi plan</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Estado actual */}
      <div className={`card ${isPremium ? 'border-brand-turquoise' : ''}`}>
        <div className="flex items-center gap-3">
          <Star className={isPremium ? 'text-brand-turquoise' : 'text-slate-400'} />
          <div>
            <p className="text-lg font-bold text-brand-navy">
              {user?.plan === 'premium' ? 'Plan Premium' : 'Plan Básico'}
            </p>
            {isPremium && user?.plan_expires_at && (
              <p className="text-sm text-slate-500">
                Válido hasta el {formatDate(user.plan_expires_at)}
              </p>
            )}
            {!isPremium && (
              <p className="text-sm text-slate-500">Acceso de solo lectura.</p>
            )}
          </div>
        </div>
      </div>

      {/* Activar / renovar Premium */}
      {premiumPlan && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Premium</h2>
            <p className="mt-1 text-2xl font-bold text-brand-turquoise">
              {formatAmount(premiumPlan.amount, premiumPlan.currency)}
              <span className="text-sm font-normal text-slate-500">
                {' '}/ {premiumPlan.period_days} días
              </span>
            </p>
          </div>

          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Crear y editar pacientes</li>
            <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Asignarte procedimientos y registrar sesiones</li>
            <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Ver los datos de contacto del paciente</li>
          </ul>

          <button onClick={handleSubscribe} className="btn-primary w-full" disabled={processing}>
            {processing
              ? 'Procesando…'
              : isPremium
                ? 'Renovar Premium'
                : 'Activar Premium'}
          </button>

          {isStub && (
            <p className="text-center text-xs text-slate-400">
              Pasarela de pago en modo de prueba.
            </p>
          )}
          <p className="text-center text-xs text-slate-400">
            El pago se procesa de forma segura mediante Bancard.
          </p>
        </div>
      )}
    </div>
  )
}
