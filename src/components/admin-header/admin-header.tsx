import { Bell, CalendarDays, ChevronDown, UserCircle2 } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  subtitle: string
  userName?: string
  userRole?: string
}

export function AdminHeader({
  title,
  subtitle,
  userName = 'Admin',
  userRole = 'Administrador',
}: AdminHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            <span>{subtitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{userRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  )
}
