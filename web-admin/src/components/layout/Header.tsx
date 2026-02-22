import React from 'react'

interface HeaderProps {
  onMenuClick: () => void
  user?: any
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              onClick={onMenuClick}
            >
              <span className="sr-only">Abrir menú</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img 
              src="/odontopacientes/web-admin/logo-app.png" 
              alt="OdontoPacientes" 
              className="h-10 ml-4"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Sistema de Gestión Odontológica
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
