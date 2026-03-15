'use client'

import type { AdminStatsSnapshot } from '../components/stats-grid'
import type { AuthMeResponseDto } from '@/types'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AdminHeader } from '@/components/admin-header'
import { pageReveal } from '@/components/animations/motion-presets'
import { showErrorToast } from '@/lib/preferences/show-error-toast'
import { authService } from '@/services/auth-service'
import { ActionModulesGrid } from '../components/action-modules-grid'
import { ActivityFeed } from '../components/activity-feed'
import { InfrastructureStatus } from '../components/infrastructure-status'
import { StatsGrid } from '../components/stats-grid'
import { AdminDashboardLayout } from '../layouts/admin-dashboard-layout'
import { getBusinessMetrics, getTechnicalMetrics } from '../services/admin-dashboard-service'

const INITIAL_STATS: AdminStatsSnapshot = {
  pendingDoctors: 24,
  validationsToday: 12,
  activeConsultations: 45,
  guardrailAlerts: 3,
}

const INITIAL_SERVER_LOAD = 32

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

export function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthMeResponseDto['user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(INITIAL_STATS)
  const [serverLoad, setServerLoad] = useState(INITIAL_SERVER_LOAD)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/login')
          return
        }

        const userData = await authService.getMe()
        if (userData.user.role !== 'ADMIN') {
          router.push('/dashboard')
          return
        }

        setUser(userData.user)

        try {
          const [business, technical] = await Promise.all([getBusinessMetrics(), getTechnicalMetrics()])

          setStats({
            pendingDoctors: business.kpis.pendingDoctors,
            validationsToday: business.growthLast7Days.doctors,
            activeConsultations: technical.sampleSize,
            guardrailAlerts: Math.max(0, Math.round(technical.errorRate)),
          })

          setServerLoad(Math.max(0, Math.min(100, technical.p95LatencyMs / 2.5)))
        }
        catch {
          // Keep dashboard visible even if metrics endpoint is unavailable.
        }
      }
      catch (error) {
        showErrorToast(error, { message: 'No fue posible validar la sesion' })
        router.push('/login')
      }
      finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  const subtitle = useMemo(() => formatSubtitleDate(new Date()), [])

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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cargando dashboard admin...</h1>
        </motion.div>
      </div>
    )
  }

  return (
    <AdminDashboardLayout onLogout={handleLogout}>
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        initial="hidden"
        animate="visible"
        variants={pageReveal}
      >
        <AdminHeader
          title="Bienvenido al Centro de Gestion Administrativa"
          subtitle={subtitle}
          userName={user?.email ?? 'Admin'}
          userRole="Super Administrador"
        />

        <StatsGrid stats={stats} />

        <ActionModulesGrid />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <ActivityFeed />
          <InfrastructureStatus serverLoad={Math.round(serverLoad)} />
        </section>
      </motion.div>
    </AdminDashboardLayout>
  )
}
