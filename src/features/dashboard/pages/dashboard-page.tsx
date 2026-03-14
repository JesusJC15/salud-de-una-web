'use client'

import type { AuthMeResponseDto } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/auth-service'

export function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthMeResponseDto['user'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/login')
          return
        }

        const userData = await authService.getMe()
        setUser(userData.user)
      }
      catch (error) {
        console.error('Error loading user:', error)
        router.push('/login')
      }
      finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/login')
    }
    catch (error) {
      console.error('Error during logout:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Cargando...
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg min-h-screen p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Bienvenido
              </h1>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Email:
                {' '}
                {user?.email}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Rol:
                {' '}
                {user?.role}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Estado:
                {' '}
                {user?.isActive ? 'Activo' : 'Inactivo'}
              </p>
            </div>

            <Button
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Cerrar Sesión
            </Button>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-linear-to-r from-aquamarine to-primary p-6 text-white">
              <h2 className="mb-2 text-2xl font-bold">Portal de Médicos</h2>
              <p className="opacity-90">
                Sistema de gestión de atención clínica y comunicación médica
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-100 p-6 dark:bg-slate-700">
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Pacientes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Gestiona pacientes y su información médica
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-6 dark:bg-slate-700">
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Reportes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Accede a reportes y estadísticas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}