import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">OdontoPacientes</h2>
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  )
}
