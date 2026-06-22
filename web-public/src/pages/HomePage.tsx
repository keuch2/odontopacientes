import { Link } from 'react-router-dom'
import { Check, Smartphone, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="animate-fade-in space-y-12">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">
          Gestioná tus pacientes desde la app OdontoPacientes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Creá tu cuenta acá y luego iniciá sesión en la aplicación móvil con el
          mismo usuario y contraseña. Desde esta web administrás tu perfil y tu plan.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {isAuthenticated ? (
            <Link to="/perfil" className="btn-primary">
              Ir a mi perfil
            </Link>
          ) : (
            <>
              <Link to="/registro" className="btn-primary">
                Crear cuenta gratis
              </Link>
              <Link to="/login" className="btn-secondary">
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Planes — en la WEB sí podemos describir Premium y el pago. */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-brand-navy">Planes</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card">
            <h3 className="text-xl font-bold text-brand-navy">Básico</h3>
            <p className="mt-1 text-sm text-slate-500">Gratis</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Consultar pacientes y procedimientos</li>
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Ver el odontograma y el historial</li>
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Administrar tu perfil</li>
            </ul>
          </div>

          <div className="card border-brand-turquoise ring-1 ring-brand-turquoise/30">
            <h3 className="text-xl font-bold text-brand-navy">Premium</h3>
            <p className="mt-1 text-sm text-slate-500">Acceso completo</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Todo lo del plan Básico</li>
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Crear y editar pacientes</li>
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Asignarte procedimientos y registrar sesiones</li>
              <li className="flex gap-2"><Check size={18} className="text-brand-turquoise" /> Ver datos de contacto del paciente</li>
            </ul>
            <Link to={isAuthenticated ? '/plan' : '/registro'} className="btn-primary mt-6 w-full">
              {isAuthenticated ? 'Activar Premium' : 'Empezar'}
            </Link>
          </div>
        </div>
      </section>

      {/* Detalles */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-1 text-brand-turquoise" />
          <div>
            <h4 className="font-semibold text-brand-navy">Una sola cuenta</h4>
            <p className="text-sm text-slate-600">
              El usuario que creás acá es el mismo con el que entrás a la app móvil.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 text-brand-turquoise" />
          <div>
            <h4 className="font-semibold text-brand-navy">Tus datos, bajo tu control</h4>
            <p className="text-sm text-slate-600">
              Editá o eliminá tu perfil cuando quieras, desde la web o la app.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
