'use client'

import type { AuthMeResponseDto } from '@/types'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cardPopIn, pageReveal, staggerItem, staggerParent } from '@/components/animations/motion-presets'
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
    await authService.logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-teal-200 border-t-teal-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Cargando...
          </h1>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="gradient-bg min-h-screen p-8 dark:bg-slate-950"
      initial="hidden"
      animate="visible"
      variants={pageReveal}
    >
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800"
          variants={staggerParent}
        >
          <motion.div className="mb-8 flex items-center justify-between" variants={staggerItem}>
            <motion.div variants={cardPopIn}>
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
            </motion.div>

            <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
              <Button
                onClick={handleLogout}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Cerrar Sesion
              </Button>
            </motion.div>
          </motion.div>

          <motion.div className="space-y-6" variants={staggerParent}>
            <motion.div className="rounded-lg bg-linear-to-r from-aquamarine to-primary p-6 text-white" variants={cardPopIn}>
              <h2 className="mb-2 text-2xl font-bold">Portal de Medicos</h2>
              <p className="opacity-90">
                Sistema de gestion de atencion clinica y comunicacion medica
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <motion.div className="rounded-lg bg-slate-100 p-6 dark:bg-slate-700" variants={cardPopIn} whileHover={{ y: -3 }}>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Pacientes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Gestiona pacientes y su informacion medica
                </p>
              </motion.div>

              <motion.div className="rounded-lg bg-slate-100 p-6 dark:bg-slate-700" variants={cardPopIn} whileHover={{ y: -3 }}>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  Reportes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Accede a reportes y estadisticas
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
