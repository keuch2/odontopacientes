interface StatsCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  loading?: boolean
}

export default function StatsCard({ title, value, icon: Icon, color, loading }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200', 
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {loading ? (
            <div className="animate-pulse bg-slate-200 h-8 w-16 rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">
              {value.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
