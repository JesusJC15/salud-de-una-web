interface ServerLoadBarProps {
  label?: string
  value: number
}

export function ServerLoadBar({ label = 'Carga del Servidor', value }: ServerLoadBarProps) {
  const normalized = Math.max(0, Math.min(100, value))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>
          {normalized}
          %
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-linear-to-r from-aquamarine to-primary"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  )
}
