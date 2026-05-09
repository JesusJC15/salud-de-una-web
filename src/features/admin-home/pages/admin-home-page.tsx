'use client'

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DatabaseZap,
  Info,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notification-bell'
import { useAiMetrics, useBusinessMetrics, useConsultationMetrics, useDashboardAlerts, useRecentErrors, useRevenueMetrics, useSystemHealth, useTechnicalMetrics } from '@/features/admin-home/hooks/use-dashboard-metrics'
import { authService } from '@/services/auth-service'
import { translateSpecialty } from '@/utils/specialty-labels'

// ─── helpers ───────────────────────────────────────────────────────────────

function fmt(n: number | undefined): string {
  if (n === undefined)
    return '—'
  if (n >= 1_000)
    return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`
}

function latency(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(2)}s` : `${Math.round(ms)}ms`
}

const WIDTH_CLASS_BY_STEP: Record<number, string> = {
  0: 'w-0',
  5: 'w-[5%]',
  10: 'w-[10%]',
  15: 'w-[15%]',
  20: 'w-[20%]',
  25: 'w-[25%]',
  30: 'w-[30%]',
  35: 'w-[35%]',
  40: 'w-[40%]',
  45: 'w-[45%]',
  50: 'w-[50%]',
  55: 'w-[55%]',
  60: 'w-[60%]',
  65: 'w-[65%]',
  70: 'w-[70%]',
  75: 'w-[75%]',
  80: 'w-[80%]',
  85: 'w-[85%]',
  90: 'w-[90%]',
  95: 'w-[95%]',
  100: 'w-[100%]',
}

function widthClassFromPercent(value: number): string {
  const clamped = Math.max(0, Math.min(100, value))
  const roundedToStep = Math.round(clamped / 5) * 5
  return WIDTH_CLASS_BY_STEP[roundedToStep] ?? 'w-0'
}

// ─── sub-components ────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-teal-50 ${className}`}>
      <div className="h-full w-full rounded-2xl bg-gradient-to-br from-teal-100/40 to-cyan-100/20" />
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent: 'teal' | 'cyan' | 'amber' | 'red' | 'green'
  loading?: boolean
}) {
  const accentMap = {
    teal: 'bg-teal-50 text-teal-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-emerald-50 text-emerald-600',
  }

  if (loading)
    return <SkeletonCard className="h-28" />

  return (
    <div className="group rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)] transition-shadow hover:shadow-[0_4px_32px_rgba(20,184,166,0.10)]">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {sub && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
            <TrendingUp className="h-3 w-3" />
            {sub}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}

function SystemHealthBadge({ degraded, loading }: { degraded: boolean, loading: boolean }) {
  if (loading)
    return <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />

  return degraded
    ? (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        Sistema degradado
      </span>
    )
    : (
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sistema saludable
      </span>
    )
}

function AlertRow({
  level,
  message,
}: {
  level: 'critical' | 'warning' | 'info'
  message: string
}) {
  const cfg = {
    critical: { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-700', label: 'CRÍTICA', icon: AlertTriangle },
    warning: { bg: 'bg-amber-50', border: 'border-l-amber-400', text: 'text-amber-700', label: 'ADVERTENCIA', icon: AlertTriangle },
    info: { bg: 'bg-cyan-50', border: 'border-l-cyan-400', text: 'text-cyan-700', label: 'INFO', icon: Info },
  }[level]

  const Icon = cfg.icon

  return (
    <div className={`flex items-start gap-3 rounded-xl border-l-4 ${cfg.border} ${cfg.bg} px-4 py-3`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.text}`} />
      <div>
        <span className={`text-xs font-black uppercase tracking-wider ${cfg.text}`}>
          {cfg.label}
          {' '}
          ·
          {' '}
        </span>
        <span className="text-xs font-medium text-slate-600">{message}</span>
      </div>
    </div>
  )
}

function QuickActionBtn({ href, icon: Icon, label, external }: { href: string, icon: React.ElementType, label: string, external?: boolean }) {
  const inner = (
    <div className="group flex flex-col items-center gap-2 rounded-2xl bg-teal-50 px-5 py-4 transition-all hover:bg-teal-100 hover:shadow-[0_4px_16px_rgba(20,184,166,0.12)]">
      <div className="rounded-xl bg-white p-2.5 shadow-sm transition-transform group-hover:scale-105">
        <Icon className="h-5 w-5 text-teal-600" />
      </div>
      <span className="text-xs font-bold text-teal-800">{label}</span>
    </div>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }

  return <Link href={href}>{inner}</Link>
}

// ─── Doctor status mini list ───────────────────────────────────────────────

function DoctorStatusSummary({
  verified,
  pending,
  rejected,
}: {
  verified: number
  pending: number
  rejected: number
}) {
  const total = verified + pending + rejected
  const verifiedPct = total > 0 ? (verified / total) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">Cobertura de verificación</span>
        <span className="text-sm font-black text-teal-600">
          {verifiedPct.toFixed(0)}
          %
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700 ${widthClassFromPercent(verifiedPct)}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Verificados', count: verified, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pendientes', count: pending, color: 'text-amber-600 bg-amber-50' },
          { label: 'Rechazados', count: rejected, color: 'text-red-600 bg-red-50' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl ${item.color} px-3 py-2.5 text-center`}>
            <p className="text-xl font-black">{item.count}</p>
            <p className="text-xs font-medium opacity-80">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

const GROWTH_METRICS: ReadonlyArray<{
  readonly id: 'patients' | 'doctors'
  readonly label: string
  readonly colorClass: string
}> = [
  {
    id: 'patients',
    label: 'Pacientes nuevos',
    colorClass: 'from-teal-400 to-teal-500',
  },
  {
    id: 'doctors',
    label: 'Médicos nuevos',
    colorClass: 'from-cyan-400 to-cyan-500',
  },
]

export function AdminHomePage() {
  const { data: biz, isLoading: bizLoading, isError: bizError } = useBusinessMetrics()
  const { data: tech, isLoading: techLoading, isError: techError } = useTechnicalMetrics()
  const { data: consult, isLoading: consultLoading } = useConsultationMetrics()
  const { data: alertsData } = useDashboardAlerts()
  const { data: health } = useSystemHealth()
  const { data: recentErrors } = useRecentErrors()
  const { data: aiMetrics } = useAiMetrics()
  const { data: revenue } = useRevenueMetrics()

  // Derive alerts from metrics
  const alerts: { level: 'critical' | 'warning' | 'info', message: string }[] = []

  if (tech && !techLoading) {
    if (tech.degraded) {
      alerts.push({ level: 'warning', message: `Sistema en modo degradado — métricas desde ${tech.source === 'memory' ? 'memoria' : 'Redis'}` })
    }
    if (tech.p95LatencyMs > 2000) {
      alerts.push({ level: 'critical', message: `Latencia P95 crítica: ${latency(tech.p95LatencyMs)} (umbral 2s)` })
    }
    else if (tech.p95LatencyMs > 1500) {
      alerts.push({ level: 'warning', message: `Latencia P95 elevada: ${latency(tech.p95LatencyMs)} — revisar carga del servidor` })
    }
    if (tech.errorRate > 0.05) {
      alerts.push({ level: 'critical', message: `Tasa de error alta: ${pct(tech.errorRate * 100)} — revisar logs del backend` })
    }
  }

  if (biz && !bizLoading) {
    if (biz.kpis.pendingDoctors > 0) {
      alerts.push({
        level: biz.kpis.pendingDoctors > 3 ? 'critical' : 'warning',
        message: `${biz.kpis.pendingDoctors} médico${biz.kpis.pendingDoctors > 1 ? 's' : ''} pendiente${biz.kpis.pendingDoctors > 1 ? 's' : ''} de validación REThUS`,
      })
    }
    if (biz.operationalSignals.unreadNotifications > 20) {
      alerts.push({ level: 'info', message: `${biz.operationalSignals.unreadNotifications} notificaciones sin leer acumuladas en el sistema` })
    }
  }

  if (consult && !consultLoading) {
    if (consult.slaCompliance !== null && consult.slaCompliance < 80) {
      alerts.push({
        level: consult.slaCompliance < 60 ? 'critical' : 'warning',
        message: `SLA de atención bajo: ${consult.slaCompliance}% de consultas cerradas en < 2h (umbral 80%)`,
      })
    }
    if (consult.statusBreakdown.pending > 10) {
      alerts.push({ level: 'warning', message: `${consult.statusBreakdown.pending} consultas pendientes en la cola — considerar agregar médicos` })
    }
  }

  if (alerts.length === 0 && !bizLoading && !techLoading) {
    alerts.push({ level: 'info', message: 'Sin alertas activas — sistema operando normalmente' })
  }

  const apiAlerts = alertsData?.items ?? []

  return (
    <div className="min-h-screen bg-[#f5fbfb]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-teal-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-manrope text-xl font-black tracking-tight text-slate-900">
              Control Operativo
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Vista ejecutiva del sistema en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <SystemHealthBadge degraded={tech?.degraded ?? false} loading={techLoading} />
            <div className="h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => void authService.logout()}
              title="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

        {/* ── API Error Banner ── */}
        {(bizError || techError) && (
          <div className="rounded-2xl border-l-4 border-l-red-500 bg-red-50 px-5 py-4">
            <p className="text-sm font-bold text-red-700">
              Error al cargar métricas del sistema.
              {' '}
              {bizError && techError ? 'Ambos servicios fallaron.' : bizError ? 'Métricas de negocio no disponibles.' : 'Métricas técnicas no disponibles.'}
              {' '}
              Verificá tu sesión o el estado del backend.
            </p>
          </div>
        )}

        {biz?.productKpis?.length
          ? (
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                KPIs de Producto
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {biz.productKpis.map(kpi => (
                  <div key={kpi.key} className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{kpi.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{kpi.formula}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                        kpi.state === 'OK'
                          ? 'bg-emerald-100 text-emerald-700'
                          : kpi.state === 'WARNING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                      >
                        {kpi.state}
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-900">
                        {kpi.value}
                        {kpi.unit}
                      </p>
                      <p className="text-xs text-slate-400">
                        Meta:
                        {' '}
                        {kpi.target}
                        {kpi.unit}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Fuente:
                      {kpi.source}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )
          : null}

        {/* ── KPIs ── */}
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Métricas del Sistema
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Pacientes totales"
              value={fmt(biz?.kpis.totalPatients)}
              sub={biz?.growthLast7Days.patients ? `+${biz.growthLast7Days.patients} / 7d` : undefined}
              icon={Users}
              accent="teal"
              loading={bizLoading}
            />
            <KpiCard
              label="Médicos verificados"
              value={fmt(biz?.kpis.verifiedDoctors)}
              sub={biz?.growthLast7Days.doctors ? `+${biz.growthLast7Days.doctors} / 7d` : undefined}
              icon={ShieldCheck}
              accent="cyan"
              loading={bizLoading}
            />
            <KpiCard
              label="Latencia P95"
              value={tech ? latency(tech.p95LatencyMs) : '—'}
              sub={tech && !tech.degraded ? 'nominal' : undefined}
              icon={Zap}
              accent={tech && tech.p95LatencyMs > 1500 ? 'amber' : 'green'}
              loading={techLoading}
            />
            <KpiCard
              label="Tasa de error"
              value={tech ? pct(tech.errorRate * 100) : '—'}
              icon={Activity}
              accent={tech && tech.errorRate > 0.03 ? 'red' : 'green'}
              loading={techLoading}
            />
          </div>

          {/* Secondary KPIs */}
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Total de médicos"
              value={fmt(biz?.kpis.totalDoctors)}
              icon={Users}
              accent="cyan"
              loading={bizLoading}
            />
            <KpiCard
              label="Pendientes validación"
              value={fmt(biz?.kpis.pendingDoctors)}
              icon={Clock}
              accent={biz && biz.kpis.pendingDoctors > 0 ? 'amber' : 'green'}
              loading={bizLoading}
            />
            <KpiCard
              label="Cobertura verificación"
              value={biz ? `${biz.operationalSignals.verificationCoverage.toFixed(0)}%` : '—'}
              icon={ShieldCheck}
              accent={biz && biz.operationalSignals.verificationCoverage < 70 ? 'amber' : 'teal'}
              loading={bizLoading}
            />
            <KpiCard
              label="Notif. sin leer"
              value={fmt(biz?.operationalSignals.unreadNotifications)}
              icon={Activity}
              accent="cyan"
              loading={bizLoading}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Alerts ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-manrope text-base font-black text-slate-900">
                  Alertas Activas
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  {alerts.length}
                </span>
              </div>
              <div className="space-y-3">
                {(bizLoading || techLoading)
                  ? Array.from({ length: 3 }).map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />
                  ))
                  : [
                    ...alerts,
                    ...apiAlerts
                      .filter(alert => alert.level !== 'OK')
                      .map(alert => ({
                        level:
                            alert.level === 'CRITICAL'
                              ? 'critical' as const
                              : 'warning' as const,
                        message: alert.message,
                      })),
                  ].map(a => (
                    <AlertRow key={a.message} level={a.level} message={a.message} />
                  ))}
              </div>
            </div>
          </div>

          {/* ── Doctor Status ── */}
          <div>
            <div className="rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <h2 className="mb-5 font-manrope text-base font-black text-slate-900">
                Estado de Médicos
              </h2>
              {bizLoading
                ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-50" />
                    ))}
                  </div>
                )
                : biz
                  ? (
                    <DoctorStatusSummary
                      verified={biz.doctorStatusBreakdown.verified}
                      pending={biz.doctorStatusBreakdown.pending}
                      rejected={biz.doctorStatusBreakdown.rejected}
                    />
                  )
                  : null}
            </div>
          </div>
        </div>

        {/* ── Growth Chart (CSS-based bar chart) ── */}
        {biz && !bizLoading && (
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
            <h2 className="mb-5 font-manrope text-base font-black text-slate-900">
              Crecimiento últimos 7 días
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {GROWTH_METRICS.map((metric) => {
                const value = metric.id === 'patients'
                  ? biz.growthLast7Days.patients
                  : biz.growthLast7Days.doctors
                const max = Math.max(value, 1)
                const widthPct = Math.min((value / (max * 1.2)) * 100, 100)
                return (
                  <div key={metric.id}>
                    <div className="mb-2 flex items-end justify-between">
                      <span className="text-sm font-semibold text-slate-500">{metric.label}</span>
                      <span className="text-2xl font-black text-slate-900">
                        +
                        {value}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${metric.colorClass} transition-all duration-1000 ${widthClassFromPercent(widthPct)}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Consultation Metrics ── */}
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Métricas de Consultas
          </h2>

          {/* KPIs row */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: Activity,
                label: 'Total consultas',
                value: consultLoading ? '—' : fmt(consult?.totalConsultations),
                sub: consult ? `${consult.statusBreakdown.pending} pendientes · ${consult.statusBreakdown.inAttention} en atención` : '',
                accent: 'text-teal-600',
              },
              {
                icon: CheckCircle2,
                label: 'Cerradas (7 días)',
                value: consultLoading ? '—' : fmt(consult?.closedLast7Days),
                sub: consult ? `de ${consult.statusBreakdown.closed} totales` : '',
                accent: 'text-emerald-600',
              },
              {
                icon: Timer,
                label: 'Tiempo promedio',
                value: consultLoading ? '—' : consult?.avgAttentionTimeMinutes != null ? `${consult.avgAttentionTimeMinutes} min` : 'N/D',
                sub: 'desde asignación a cierre',
                accent: 'text-cyan-600',
              },
              {
                icon: Zap,
                label: 'Cumplimiento SLA',
                value: consultLoading ? '—' : consult?.slaCompliance != null ? pct(consult.slaCompliance) : 'N/D',
                sub: 'cerradas en menos de 2h',
                accent: consult?.slaCompliance != null && consult.slaCompliance < 80 ? 'text-red-600' : 'text-emerald-600',
              },
            ].map(({ icon: Icon, label, value, sub, accent }) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
                <div className="mb-1 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${accent}`} />
                  <span className="text-xs font-semibold text-slate-400">{label}</span>
                </div>
                <p className={`text-2xl font-black ${accent}`}>{value}</p>
                {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* By specialty */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <div className="mb-4 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-500" />
                <h3 className="text-sm font-bold text-slate-700">Por especialidad</h3>
              </div>
              {consultLoading
                ? <div className="space-y-2">{[0, 1].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-50" />)}</div>
                : (consult?.bySpecialty ?? []).length === 0
                  ? <p className="text-xs text-slate-400">Sin datos aún</p>
                  : (consult?.bySpecialty ?? []).map((row) => {
                    const closedPct = row.total > 0 ? (row.closed / row.total) * 100 : 0

                    return (
                      <div key={row.specialty} className="mb-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">{translateSpecialty(row.specialty)}</span>
                          <span className="text-xs text-slate-400">
                            {row.closed}
                            /
                            {row.total}
                            {' '}
                            cerradas
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 ${widthClassFromPercent(closedPct)}`}
                          />
                        </div>
                      </div>
                    )
                  })}
            </div>

            {/* Top doctors */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-500" />
                <h3 className="text-sm font-bold text-slate-700">Top médicos (casos cerrados)</h3>
              </div>
              {consultLoading
                ? (
                  <div className="space-y-2">
                    {[
                      0,
                      1,
                      2,
                    ].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-50" />)}
                  </div>
                )
                : (consult?.topDoctors ?? []).length === 0
                  ? <p className="text-xs text-slate-400">Sin datos aún</p>
                  : (consult?.topDoctors ?? []).map((doc, idx) => (
                    <div key={doc.doctorId} className="flex items-center gap-3 py-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-600">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{doc.name}</p>
                        {doc.specialty && (
                          <p className="text-xs text-slate-400">{translateSpecialty(doc.specialty)}</p>
                        )}
                      </div>
                      <span className="text-sm font-black text-teal-600">{doc.closed}</span>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* ── Sistema / Observabilidad ── */}
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Sistema
          </h2>

          {/* Health badges */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            {([
              'mongodb',
              'redis',
              'ai',
            ] as const).map((key) => {
              const value = health?.[key]
              const ok = value === 'connected' || value === 'up' || value === 'healthy'
              return (
                <div key={key} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                  <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`text-xs font-bold uppercase ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {key === 'mongodb' ? 'MongoDB' : key === 'redis' ? 'Redis' : 'IA (Gemini)'}
                  </span>
                  <span className={`ml-auto text-[11px] ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {value ?? '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Revenue KPI */}
          {revenue && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xl font-black text-emerald-900">
                  $
                  {revenue.currentMonth.totalRevenue.toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-emerald-700">Ingresos del mes (COP)</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xl font-black text-slate-900">{revenue.currentMonth.paidConsultations}</p>
                <p className="text-xs text-slate-500">Consultas pagadas este mes</p>
              </div>
            </div>
          )}

          {/* AI metrics */}
          {aiMetrics && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Llamadas IA (24h)', value: String(aiMetrics.total) },
                { label: 'Tasa éxito', value: `${aiMetrics.successRate}%` },
                { label: 'Errores', value: String(aiMetrics.errorCount) },
                { label: 'Latencia prom.', value: `${aiMetrics.avgLatencyMs} ms` },
              ].map(m => (
                <div key={m.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-lg font-black text-slate-900">{m.value}</p>
                  <p className="text-xs text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent errors */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-800">Errores recientes (5xx)</p>
              {recentErrors && recentErrors.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{recentErrors.length}</span>
              )}
            </div>
            {!recentErrors || recentErrors.length === 0
              ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Sin errores recientes</p>
              )
              : (
                <div className="divide-y divide-slate-100">
                  {recentErrors.slice(0, 5).map(err => (
                    <div key={err.id} className="flex items-start gap-3 px-4 py-2.5">
                      <span className="mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-700">{err.statusCode}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {err.method}
                          {' '}
                          {err.url}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">{err.errorMessage}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {new Date(err.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </section>

        {/* ── Quick Access ── */}
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
            Acceso Rápido
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <QuickActionBtn href="/doctor/queue" icon={Activity} label="Cola de consultas" />
            <QuickActionBtn href="/admin/doctors" icon={Users} label="Doctores" />
            <QuickActionBtn href="/admin/users" icon={ShieldCheck} label="Usuarios" />
            <QuickActionBtn href="/admin/knowledge" icon={DatabaseZap} label="Knowledge" />
            <QuickActionBtn href="/admin/ai/prompts" icon={Zap} label="Prompts IA" />
            <QuickActionBtn href="/admin/billing" icon={TrendingUp} label="Facturación" />
          </div>
        </section>

      </div>
    </div>
  )
}
