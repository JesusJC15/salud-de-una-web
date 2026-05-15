'use client'

import {
  Activity,
  AlertTriangle,
  ChevronRight,
  History,
  LogOut,
  PauseCircle,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { DashboardBrandMark } from '@/components/dashboard/dashboard-brand-mark'
import { NotificationBell } from '@/components/notification-bell'
import { useConsultationQueue } from '@/features/doctor-queue/hooks/use-consultation-queue'
import { useDoctorAvailability } from '@/features/doctor-queue/hooks/use-doctor-availability'
import { doctorService } from '@/features/doctor-queue/services/doctor-service'
import { authService } from '@/services/auth-service'

interface FeatureCardProps {
  href: string
  icon: React.ElementType
  title: string
  description: string
  badge?: string | number | null
  accent: 'teal' | 'cyan' | 'slate'
}

const ACCENT_MAP = {
  teal: {
    bg: 'bg-teal-50 hover:bg-teal-100/60',
    icon: 'bg-teal-500 text-white',
    badge: 'bg-teal-100 text-teal-700',
    chevron: 'text-teal-400',
  },
  cyan: {
    bg: 'bg-cyan-50 hover:bg-cyan-100/60',
    icon: 'bg-cyan-500 text-white',
    badge: 'bg-cyan-100 text-cyan-700',
    chevron: 'text-cyan-400',
  },
  slate: {
    bg: 'bg-slate-50 hover:bg-slate-100/60',
    icon: 'bg-slate-700 text-white',
    badge: 'bg-slate-200 text-slate-700',
    chevron: 'text-slate-400',
  },
}

function FeatureCard({ href, icon: Icon, title, description, badge, accent }: FeatureCardProps) {
  const c = ACCENT_MAP[accent]
  return (
    <Link href={href} className={`group flex items-center gap-5 rounded-2xl border border-transparent ${c.bg} p-5 transition-all hover:shadow-[0_4px_24px_rgba(20,184,166,0.10)]`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.icon} shadow-sm`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-black text-slate-900">{title}</p>
          {badge != null && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.badge}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      <ChevronRight className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 ${c.chevron}`} />
    </Link>
  )
}

export function DoctorPortalPage() {
  const { availability, doctorName, specialty, doctorStatus, isUpdating, toggle } = useDoctorAvailability()
  const { data: queueData, isLoading: queueLoading } = useConsultationQueue()
  const [resubmitting, setResubmitting] = useState(false)

  const pendingCount = queueData?.items.length ?? 0
  const greeting = (() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  })()

  const handleLogout = async () => {
    try {
      await authService.logout()
    }
    catch {
      toast.error('No fue posible cerrar sesión')
    }
  }

  const handleRethusResubmit = async () => {
    setResubmitting(true)
    try {
      await doctorService.rethusResubmit()
      toast.success('Solicitud de re-verificación enviada. El equipo revisará tu caso.')
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : 'No fue posible enviar la solicitud')
    }
    finally {
      setResubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5fbfb]">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-teal-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <DashboardBrandMark />
            <div>
              <p className="text-xs font-medium text-slate-400">
                {greeting}
                ,
              </p>
              <h1 className="font-manrope text-lg font-black tracking-tight text-slate-900">
                Dr.
                {' '}
                {doctorName || 'Doctor'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              onClick={toggle}
              disabled={isUpdating}
              title={availability === 'AVAILABLE' ? 'Pausar disponibilidad' : 'Reanudar disponibilidad'}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60 ${
                availability === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              }`}
            >
              {availability === 'AVAILABLE'
                ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Disponible
                  </>
                )
                : (
                  <>
                    <PauseCircle className="h-3.5 w-3.5" />
                    En pausa
                  </>
                )}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              title="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">

        {/* Verification status banner */}
        {(doctorStatus === 'PENDING' || doctorStatus === 'REJECTED') && (
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${doctorStatus === 'REJECTED' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${doctorStatus === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${doctorStatus === 'REJECTED' ? 'text-red-700' : 'text-amber-700'}`}>
                {doctorStatus === 'REJECTED' ? 'Verificación REThUS rechazada' : 'Verificación REThUS pendiente'}
              </p>
              <p className={`mt-0.5 text-xs ${doctorStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>
                {doctorStatus === 'REJECTED'
                  ? 'Tu verificación fue rechazada. Podés solicitar una revisión al equipo de administración.'
                  : 'Tu cuenta está pendiente de verificación. Podés atender consultas una vez que sea aprobada.'}
              </p>
            </div>
            {doctorStatus === 'REJECTED' && (
              <button
                type="button"
                onClick={() => void handleRethusResubmit()}
                disabled={resubmitting}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resubmitting ? 'animate-spin' : ''}`} />
                {resubmitting ? 'Enviando...' : 'Solicitar revisión'}
              </button>
            )}
          </div>
        )}

        {/* Availability banner when paused */}
        {availability === 'PAUSED' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <PauseCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-700">
              Estás en pausa. Los pacientes siguen en cola pero no recibirás asignaciones automáticas.
            </p>
            <button type="button" onClick={toggle} className="ml-auto text-xs font-bold text-amber-700 underline">
              Reanudar
            </button>
          </div>
        )}

        {/* Welcome card */}
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-[0_4px_32px_rgba(20,184,166,0.25)]">
          <p className="text-sm font-medium text-teal-100">Panel de trabajo</p>
          <h2 className="mt-1 font-manrope text-2xl font-black tracking-tight">
            SaludDeUna
          </h2>
          {specialty && (
            <p className="mt-2 text-sm font-semibold text-teal-100 opacity-90">
              {specialty.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-xl bg-white/20 px-3 py-2 text-center">
              <p className="text-2xl font-black">
                {queueLoading ? '–' : pendingCount}
              </p>
              <p className="text-xs font-semibold text-teal-100">En cola</p>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Funcionalidades disponibles
          </h2>
          <div className="space-y-3">
            <FeatureCard
              href="/doctor/queue"
              icon={Activity}
              title="Cola de Consultas"
              description="Ver y atender consultas pendientes en tiempo real"
              badge={!queueLoading && pendingCount > 0 ? pendingCount : null}
              accent="teal"
            />
            <FeatureCard
              href="/doctor/history"
              icon={History}
              title="Historial de Consultas"
              description="Revisá tus consultas cerradas y resúmenes clínicos anteriores"
              accent="cyan"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
