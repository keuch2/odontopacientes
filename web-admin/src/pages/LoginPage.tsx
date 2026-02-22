import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/hooks/useToast'

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const { success, error } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    }
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password)
      success('¡Bienvenido! Has iniciado sesión correctamente')
    } catch (err: any) {
      setError('root', {
        type: 'manual',
        message: err.message || 'Error al iniciar sesión',
      })
      
      error(err.message || 'Credenciales incorrectas')
    }
  }

  const isFormLoading = isLoading || isSubmitting

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6">
            <img 
              src="/odontopacientes/web-admin/logo-app.png" 
              alt="OdontoPacientes" 
              className="h-20 mx-auto"
            />
          </div>
          <p className="mt-2 text-slate-600">
            Sistema de gestión de pacientes odontológicos
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="label">
                Correo electrónico
              </label>
              <input
                {...register('email', {
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido',
                  },
                })}
                type="email"
                id="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="tu@email.com"
                disabled={isFormLoading}
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="label">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Tu contraseña"
                  disabled={isFormLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="error-message">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                {...register('remember')}
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                disabled={isFormLoading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-700">
                Recordar sesión
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isFormLoading}
                className="btn btn-primary w-full btn-lg"
              >
                {isFormLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Credenciales de demostración:</p>
            <div className="grid grid-cols-1 gap-2 text-xs bg-slate-50 p-3 rounded-lg">
              <div>
                <strong>Administrador:</strong> admin@demo.test / password
              </div>
              <div>
                <strong>Estudiante:</strong> alumno@demo.test / password
              </div>
              <div>
                <strong>Coordinador:</strong> coordinador@demo.test / password
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>
            ¿Problemas para acceder? Contacta al{' '}
            <a href="mailto:admin@demo.test" className="text-primary-600 hover:text-primary-700">
              administrador
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
