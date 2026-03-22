'use client'

import type { ComponentType } from 'react'
import { Activity, LayoutDashboard, LogOut, Settings, ShieldQuestion, Stethoscope, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarNavigationProps {
  activeItem?: 'dashboard' | 'doctors' | 'users' | 'settings' | 'analytics'
  className?: string
  onLogout?: () => void | Promise<void>
  onSupport?: () => void
}

interface NavigationItem {
  key: NonNullable<SidebarNavigationProps['activeItem']>
  label: string
  icon: ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'doctors', label: 'Medicos (REThUS)', icon: Stethoscope },
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'settings', label: 'Configuracion', icon: Settings },
  { key: 'analytics', label: 'Analitica', icon: Activity },
]

const NAVIGATION_ROUTES: Record<NavigationItem['key'], string> = {
  dashboard: '/dashboard/admin',
  doctors: '/dashboard/admin/doctors/verification',
  users: '/dashboard/admin/users',
  settings: '/dashboard/admin/settings',
  analytics: '/dashboard/admin/analytics',
}

export function SidebarNavigation({
  activeItem = 'dashboard',
  className,
  onLogout,
  onSupport,
}: SidebarNavigationProps) {
  const router = useRouter()

  return (
    <aside className={cn('flex h-full min-h-screen w-full max-w-[260px] flex-col border-r border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95', className)}>
      <div className="px-6 pt-6">
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">SaludDeUna Admin</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Super Administrador</p>
        </div>
      </div>

      <nav className="mt-6 flex-1 px-4">
        <ul className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.key === activeItem

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => router.push(NAVIGATION_ROUTES[item.key])}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                  )}
                >
                  <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-teal-600 dark:text-teal-200' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300')} />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-4 border-t border-slate-200 px-4 py-5 dark:border-slate-800">
        <Button
          type="button"
          className="h-11 w-full rounded-xl bg-linear-to-r from-aquamarine to-primary text-white shadow-sm hover:opacity-95"
          onClick={onSupport}
        >
          <ShieldQuestion className="mr-2 h-4 w-4" />
          Soporte Tecnico
        </Button>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/40"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  )
}
