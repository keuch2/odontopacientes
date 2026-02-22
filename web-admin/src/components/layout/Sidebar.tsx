import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Link, useLocation } from 'react-router-dom'
import { 
  X, 
  Home, 
  Users, 
  ClipboardList, 
  GraduationCap, 
  Settings,
  Activity,
  FileText,
  Bell,
  BarChart3,
  Megaphone
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  name: string
  href: string
  icon: any
  roles: string[]
  badge?: number
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'coordinador', 'admision', 'alumno'] },
  { name: 'Pacientes', href: '/patients', icon: Users, roles: ['admin', 'coordinador', 'admision', 'alumno'] },
  { name: 'Cátedras', href: '/chairs', icon: ClipboardList, roles: ['admin', 'coordinador'] },
  { name: 'Alumnos', href: '/students', icon: GraduationCap, roles: ['admin', 'coordinador'] },
  { name: 'Mis Asignaciones', href: '/my-assignments', icon: Activity, roles: ['alumno'] },
  { name: 'Reportes', href: '/reports', icon: BarChart3, roles: ['admin', 'coordinador'] },
  { name: 'Importaciones', href: '/imports', icon: FileText, roles: ['admin', 'admision'] },
  { name: 'Universidades', href: '/universities', icon: GraduationCap, roles: ['admin'] },
  { name: 'Publicidad', href: '/ads', icon: Megaphone, roles: ['admin'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['admin'] },
]

const secondaryNavigation: NavItem[] = [
  { name: 'Notificaciones', href: '/notifications', icon: Bell, roles: ['admin', 'coordinador', 'admision', 'alumno'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['admin', 'coordinador'] },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  
  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  )
  
  const filteredSecondaryNavigation = secondaryNavigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 pt-4">
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={classNames(
                        isActive ? 'nav-item-active' : 'nav-item-inactive',
                        'nav-item group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>

          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              {filteredSecondaryNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={classNames(
                        isActive ? 'nav-item-active' : 'nav-item-inactive',
                        'nav-item group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>

      {/* Footer info */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.role === 'admin' ? 'Administrador' :
               user?.role === 'coordinador' ? 'Coordinador' :
               user?.role === 'admision' ? 'Admisión' :
               'Estudiante'}
            </p>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <p className="truncate">{user?.faculty?.name}</p>
          <p className="truncate">{user?.faculty?.university?.name}</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                      <span className="sr-only">Cerrar sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 bg-white px-6 pb-4">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
