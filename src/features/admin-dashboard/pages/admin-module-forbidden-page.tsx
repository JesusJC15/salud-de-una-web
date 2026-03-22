'use client'

import type { AuthMeResponseDto } from '@/types'
import type { ComponentProps } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AdminHeader } from '@/components/admin-header'
import { Button } from '@/components/ui/button'
import { showErrorToast } from '@/lib/preferences/show-error-toast'
import { authService } from '@/services/auth-service'
import { AdminDashboardLayout } from '../layouts/admin-dashboard-layout'

type SidebarItem = NonNullable<ComponentProps<typeof AdminDashboardLayout>['activeItem']>

interface AdminModuleForbiddenPageProps {
  activeItem: SidebarItem
  moduleTitle: string
}

function formatSubtitleDate(now: Date) {
  const dateText = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now)

  const timeText = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now)

  const normalizedDate = dateText.charAt(0).toUpperCase() + dateText.slice(1)

  return `${normalizedDate} | ${timeText}`
}

export function AdminModuleForbiddenPage({
  activeItem,
  moduleTitle,
}: AdminModuleForbiddenPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<AuthMeResponseDto['user'] | null>(null)
  const [isRoleChecked, setIsRoleChecked] = useState(false)

  useEffect(() => {
    const validateRole = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/login')
          return
        }

        const userData = await authService.getMe()
        if (userData.user.role !== 'ADMIN') {
          router.push('/403')
          return
        }

        setUser(userData.user)
        setIsRoleChecked(true)
      }
      catch (roleError) {
        showErrorToast(roleError, { message: 'No fue posible validar la sesion' })
        router.push('/login')
      }
    }

    validateRole()
  }, [router])

  const subtitle = useMemo(() => formatSubtitleDate(new Date()), [])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  if (!isRoleChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Cargando validacion de permisos...</p>
      </div>
    )
  }

  return (
    <AdminDashboardLayout onLogout={handleLogout} activeItem={activeItem}>
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminHeader
          title={moduleTitle}
          subtitle={subtitle}
          userName={user?.email ?? 'Admin'}
          userRole="Super Administrador"
        />

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="mb-4 flex items-center gap-3 text-amber-700 dark:text-amber-300">
            <ShieldAlert className="h-6 w-6" />
            <h2 className="text-xl font-black">Forbidden Page (403)</h2>
          </div>

          <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
            Este modulo aun no esta habilitado. Puedes usar la barra lateral para navegar a Dashboard o Medicos (REThUS).
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button type="button" onClick={() => router.push('/dashboard/admin')}>
              Volver al dashboard
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/admin/doctors/verification')}>
              Ir a medicos (REThUS)
            </Button>
          </div>
        </section>
      </div>
    </AdminDashboardLayout>
  )
}
