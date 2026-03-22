import type { ReactNode } from 'react'
import { SidebarNavigation } from '@/components/sidebar-navigation'

interface AdminDashboardLayoutProps {
  activeItem?: 'dashboard' | 'doctors' | 'users' | 'settings' | 'analytics'
  children: ReactNode
  onLogout: () => void | Promise<void>
}

export function AdminDashboardLayout({
  activeItem = 'dashboard',
  children,
  onLogout,
}: AdminDashboardLayoutProps) {
  return (
    <div className="gradient-bg min-h-screen dark:bg-slate-950">
      <div className="flex min-h-screen flex-col xl:flex-row">
        <SidebarNavigation activeItem={activeItem} onLogout={onLogout} className="w-full xl:sticky xl:top-0 xl:h-screen" />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
