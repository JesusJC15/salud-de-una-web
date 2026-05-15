'use client'

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  History,
  LogOut,
  PauseCircle,
  RefreshCw,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { DashboardBrandMark } from '@/components/dashboard/dashboard-brand-mark'
import { NotificationBell } from '@/components/notification-bell'
import { useConsultationQueue } from '@/features/doctor-queue/hooks/use-consultation-queue'
import { useDoctorAvailability } from '@/features/doctor-queue/hooks/use-doctor-availability'
import { useDoctorHistory } from '@/features/doctor-queue/hooks/use-doctor-history'
import { doctorService } from '@/features/doctor-queue/services/doctor-service'
import { authService } from '@/services/auth-service'
import { translateSpecialty } from '@/utils/specialty-labels'

// ─── Quick Action Card ──────────────────────────────────────────────────────

interface QuickActionProps {
  href: string
  icon: React.ElementType
  title: string
  description: string
  badge?: string | number | null
  variant: 'primary' | 'secondary' | 'ghost'
}

function QuickAction({ href, icon: Icon, title, description, badge, variant }: QuickActionProps) {
  const styles = {
    primary: {
      outer: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-[0_8px_32px_rgba(20,184,166,0.30)] hover:shadow-[0_12px_40px_rgba(20,184,166,0.40)] hover:-translate-y-0.5',
      icon: 'bg-white/20',
      title: 'text-white',
      desc: 'text-teal-100',
      badge: 'bg-white/25 text-white',
      arrow: 'text-white/70',
    },
    secondary: {
      outer: 'bg-white border border-slate-100 hover:border-teal-200 hover:shadow-[0_4px_24px_rgba(20,184,166,0.10)]',
      icon: 'bg-teal-50 text-teal-600',
      title: 'text-slate-900',
      desc: 'text-slate-500',
      badge: 'bg-teal-100 text-teal-700',
      arrow: 'text-teal-400',
    },
    ghost: {
      outer: 'bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm',
      icon: 'bg-slate-200 text-slate-600',
      title: 'text-slate-800',
      desc: 'text-slate-500',
      badge: 'bg-slate-200 text-slate-600',
      arrow: 'text-slate-400',
    },
  }
  const s = styles[variant]

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl p-5 transition-all ${s.outer}`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.icon}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold ${s.title}`}>{title}</p>
          {badge != null && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-black ${s.badge}`}>
              {badge}
            </span>
          )}
        </div>
        <p className={`mt-0.5 text-xs ${s.desc}`}>{description}</p>
      </div>
      <ArrowRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${s.arrow}`} />
    </Link>
  )
}

// ─── KPI Mini Card ──────────────────────────────────────────────────────────

function KpiMini({
  value,
  label,
  color,
  icon: Icon,
}: {
  value: number | string
  label: string
  color: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(20,184,166,0.06)]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  )
}

// ─── Availability Toggle Button ─────────────────────────────────────────────

function AvailabilityToggle({
  availability,
  isUpdating,
  toggle,
}: {
  availability: string | null
  isUpdating: boolean
  toggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isUpdating}
      title={availability === 'AVAILABLE' ? 'Pausar disponibilidad' : 'Reanudar disponibilidad'}
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-60 ${
        availability === 'AVAILABLE'
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200'
      }`}
    >
      {availability === 'AVAILABLE'
        ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
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
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function DoctorPortalPage() {
  const { availability, doctorName, specialty, doctorStatus, isUpdating, toggle } = useDoctorAvailability()
  const { data: queueData, isLoading: queueLoading } = useConsultationQueue()
  const { data: historyData } = useDoctorHistory(1, 'CLOSED')
  const [resubmitting, setResubmitting] = useState(false)

  const pendingCount = queueData?.items.length ?? 0
  const highCount = queueData?.items.filter(i => i.priority === 'HIGH').length ?? 0
  const closedTotal = historyData?.total ?? 0

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <DashboardBrandMark />
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <p className="text-xs font-medium text-slate-400">{greeting}</p>
              <h1 className="font-manrope text-base font-black tracking-tight text-slate-900 leading-none mt-0.5">
                Dr.
                {' '}
                {doctorName || 'Doctor'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <AvailabilityToggle
              availability={availability}
              isUpdating={isUpdating}
              toggle={toggle}
            />
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

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">

        {/* ── Verification Banners ── */}
        {(doctorStatus === 'PENDING' || doctorStatus === 'REJECTED') && (
          <div className={`flex items-start gap-4 rounded-2xl border p-4 ${
            doctorStatus === 'REJECTED'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
          }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              doctorStatus === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
            }`}
            >
              <AlertTriangle className={`h-5 w-5 ${doctorStatus === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${doctorStatus === 'REJECTED' ? 'text-red-800' : 'text-amber-800'}`}>
                {doctorStatus === 'REJECTED' ? 'Verificación REThUS rechazada' : 'Verificación REThUS pendiente'}
              </p>
              <p className={`mt-0.5 text-xs leading-relaxed ${doctorStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>
                {doctorStatus === 'REJECTED'
                  ? 'Tu verificación fue rechazada. Podés solicitar una revisión al equipo de administración.'
                  : 'Tu cuenta está pendiente de verificación. Podrás atender consultas una vez que sea aprobada.'}
              </p>
            </div>
            {doctorStatus === 'REJECTED' && (
              <button
                type="button"
                onClick={() => void handleRethusResubmit()}
                disabled={resubmitting}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resubmitting ? 'animate-spin' : ''}`} />
                {resubmitting ? 'Enviando...' : 'Solicitar revisión'}
              </button>
            )}
          </div>
        )}

        {/* ── Pausa Banner ── */}
        {availability === 'PAUSED' && (
          <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <PauseCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="flex-1 text-sm font-medium text-amber-800">
              Estás en pausa. Los pacientes siguen en cola pero no recibirás asignaciones automáticas.
            </p>
            <button
              type="button"
              onClick={toggle}
              className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              Reanudar
            </button>
          </div>
        )}

        {/* ── Hero / Welcome ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 p-7 shadow-[0_8px_40px_rgba(20,184,166,0.28)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/45" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-white/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-100 uppercase tracking-widest">Portal médico</p>
                  <h2 className="font-manrope text-2xl font-black text-white leading-tight">
                    SaludDeUna
                  </h2>
                </div>
              </div>
              {specialty && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-200" />
                  <span className="text-sm font-semibold text-white">
                    {translateSpecialty(specialty)}
                  </span>
                </div>
              )}
            </div>

            {/* Queue indicator */}
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur-sm">
                {queueLoading
                  ? <div className="mx-auto h-7 w-8 animate-pulse rounded bg-white/20" />
                  : <p className="text-3xl font-black text-white leading-none">{pendingCount}</p>}
                <p className="mt-1 text-xs font-semibold text-teal-100">En cola</p>
              </div>
              {!queueLoading && highCount > 0 && (
                <div className="rounded-2xl bg-red-500/30 px-5 py-3 text-center backdrop-blur-sm ring-1 ring-red-400/30">
                  <p className="text-3xl font-black text-white leading-none">{highCount}</p>
                  <p className="mt-1 text-xs font-semibold text-red-200">Alta prioridad</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Bar ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiMini
            value={queueLoading ? '–' : pendingCount}
            label="Pendientes ahora"
            color="bg-teal-50 text-teal-600"
            icon={Activity}
          />
          <KpiMini
            value={queueLoading ? '–' : highCount}
            label="Alta prioridad"
            color="bg-red-50 text-red-500"
            icon={AlertTriangle}
          />
          <KpiMini
            value={closedTotal}
            label="Consultas cerradas"
            color="bg-cyan-50 text-cyan-600"
            icon={TrendingUp}
          />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Acceso rápido
          </h2>
          <div className="space-y-3">
            <QuickAction
              href="/doctor/queue"
              icon={Activity}
              title="Cola de Consultas"
              description={
                pendingCount > 0
                  ? `${pendingCount} paciente${pendingCount > 1 ? 's' : ''} esperando atención${highCount > 0 ? ` · ${highCount} de alta prioridad` : ''}`
                  : 'Ver y atender consultas pendientes en tiempo real'
              }
              badge={!queueLoading && pendingCount > 0 ? pendingCount : null}
              variant="primary"
            />
            <QuickAction
              href="/doctor/history"
              icon={History}
              title="Historial de Consultas"
              description="Revisá tus consultas cerradas, resúmenes clínicos y métricas de atención"
              badge={closedTotal > 0 ? closedTotal : null}
              variant="secondary"
            />
          </div>
        </div>

        {/* ── Status Footer ── */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/60 px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-xs text-slate-500">
            Cola actualizada automáticamente cada 30 segundos.
            {availability === 'AVAILABLE' && ' Recibirás asignaciones automáticas.'}
          </p>
        </div>
      </div>
    </div>
  )
}
