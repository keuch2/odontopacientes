import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center">
            <img
              src={`${import.meta.env.BASE_URL}logo-app.png`}
              alt="OdontoPacientes"
              className="h-9"
            />
          </Link>

          <nav className="hidden items-center gap-4 sm:flex">
            {isAuthenticated ? (
              <>
                <Link to="/perfil" className="flex items-center gap-1 text-slate-700 hover:text-brand-turquoise">
                  <UserIcon size={18} /> Mi perfil
                </Link>
                <Link to="/plan" className="text-slate-700 hover:text-brand-turquoise">
                  Mi plan
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-slate-700 hover:text-red-600">
                  <LogOut size={18} /> Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-700 hover:text-brand-turquoise">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="btn-primary">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>

          <button className="sm:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:hidden">
            {isAuthenticated ? (
              <>
                <Link to="/perfil" onClick={() => setMenuOpen(false)}>Mi perfil</Link>
                <Link to="/plan" onClick={() => setMenuOpen(false)}>Mi plan</Link>
                <button onClick={handleLogout} className="text-left text-red-600">Salir</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
                <Link to="/registro" onClick={() => setMenuOpen(false)}>Crear cuenta</Link>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} OdontoPacientes ·{' '}
          <a
            href="https://codexpy.com/odontopacientes/privacidad.html"
            className="text-brand-turquoise hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Política de privacidad
          </a>
        </p>
        {user && <p className="mt-1 text-xs text-slate-400">Sesión: {user.email}</p>}
      </footer>
    </div>
  )
}
