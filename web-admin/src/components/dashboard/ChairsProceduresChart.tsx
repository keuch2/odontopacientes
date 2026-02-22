interface ChairData {
  id: number
  name: string
  key: string
  color: string
  procedures_total: number
  procedures_available: number
  procedures_in_progress: number
  procedures_completed: number
}

interface ChairsProceduresChartProps {
  data: ChairData[]
}

export default function ChairsProceduresChart({ data }: ChairsProceduresChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Procedimientos por Cátedra
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <p className="text-lg mb-2">No hay datos disponibles</p>
            <p className="text-sm">Los datos aparecerán una vez que haya procedimientos registrados</p>
          </div>
        </div>
      </div>
    )
  }

  const maxTotal = Math.max(...data.map(chair => chair.procedures_total))

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Procedimientos por Cátedra
        </h3>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-600">Disponibles</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-slate-600">En Proceso</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-600">Completados</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((chair) => {
          const totalWidth = maxTotal > 0 ? (chair.procedures_total / maxTotal) * 100 : 0
          const availablePercentage = chair.procedures_total > 0 
            ? (chair.procedures_available / chair.procedures_total) * 100 
            : 0
          const inProgressPercentage = chair.procedures_total > 0 
            ? (chair.procedures_in_progress / chair.procedures_total) * 100 
            : 0
          const completedPercentage = chair.procedures_total > 0 
            ? (chair.procedures_completed / chair.procedures_total) * 100 
            : 0

          return (
            <div key={chair.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: chair.color }}
                  ></div>
                  <span className="font-medium text-slate-900">{chair.name}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    ({chair.key})
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-700">
                  {chair.procedures_total} total
                </div>
              </div>
              
              <div className="relative">
                <div 
                  className="h-6 bg-slate-100 rounded-lg overflow-hidden"
                  style={{ width: `${Math.max(totalWidth, 10)}%` }}
                >
                  <div className="flex h-full">
                    <div 
                      className="bg-green-500"
                      style={{ width: `${availablePercentage}%` }}
                    ></div>
                    <div 
                      className="bg-yellow-500"
                      style={{ width: `${inProgressPercentage}%` }}
                    ></div>
                    <div 
                      className="bg-blue-500"
                      style={{ width: `${completedPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{chair.procedures_available} disponibles</span>
                  <span>{chair.procedures_in_progress} en proceso</span>
                  <span>{chair.procedures_completed} completados</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
