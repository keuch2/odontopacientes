import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import LoginPage from '@/pages/LoginPage'
import DashboardAdmin from '@/pages/DashboardAdmin'
import PatientsPage from '@/pages/PatientsPage'
import PatientDetailPage from '@/pages/PatientDetailPage'
import StudentsPage from '@/pages/StudentsPage'
import ChairsPage from '@/pages/ChairsPage'
import ChairDetailPage from '@/pages/ChairDetailPage'
import UniversitiesPage from '@/pages/UniversitiesPage'
import UsersPage from '@/pages/UsersPage'
import AdsPage from '@/pages/AdsPage'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { Toaster } from '@/components/ui/Toaster'

function App() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    console.log('App mounted, checking auth...')
    checkAuth().catch(err => {
      console.error('Auth check failed:', err)
    })
  }, [checkAuth])

  console.log('App render:', { isLoading, isAuthenticated, user })

  if (isLoading) {
    console.log('Showing loading screen')
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:pl-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<DashboardAdmin />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/chairs" element={<ChairsPage />} />
              <Route path="/chairs/:id" element={<ChairDetailPage />} />
              <Route path="/universities" element={<UniversitiesPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/my-assignments" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-slate-900">Mis Asignaciones</h1><p className="text-slate-600 mt-2">Vista en desarrollo</p></div>} />
              <Route path="/reports" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-slate-900">Reportes</h1><p className="text-slate-600 mt-2">Vista en desarrollo</p></div>} />
              <Route path="/imports" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-slate-900">Importaciones</h1><p className="text-slate-600 mt-2">Vista en desarrollo</p></div>} />
              <Route path="/notifications" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1><p className="text-slate-600 mt-2">Vista en desarrollo</p></div>} />
              <Route path="/settings" element={<div className="text-center py-12"><h1 className="text-2xl font-bold text-slate-900">Configuración</h1><p className="text-slate-600 mt-2">Vista en desarrollo</p></div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

export default App
