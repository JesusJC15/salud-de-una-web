'use client'

import type { ConsultationPriority, QueueItem } from '@/features/doctor-queue/services/consultation-service'
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  Clock,
  LogOut,
  PauseCircle,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Timer,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { NotificationBell } from '@/components/notification-bell'
import { useAssignConsultation } from '@/features/doctor-queue/hooks/use-assign-consultation'
import { useConsultationDetail } from '@/features/doctor-queue/hooks/use-consultation-detail'
import { useConsultationQueue } from '@/features/doctor-queue/hooks/use-consultation-queue'
import { useDoctorAvailability } from '@/features/doctor-queue/hooks/use-doctor-availability'
import { authService } from '@/services/auth-service'
import { translateSpecialty } from '@/utils/specialty-labels'

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr)
    return '—'
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
  if (mins < 1)
    return 'Recién llegado'
  if (mins === 1)
    return '1 min en espera'
  if (mins < 60)
    return `${mins} min en espera`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}min en espera`
}

function waitUrgency(dateStr: string | null): 'high' | 'medium' | 'low' {
  if (!dateStr)
    return 'low'
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
  if (mins > 45)
    return 'high'
  if (mins > 20)
    return 'medium'
  return 'low'
}

// ─── Priority config ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  ConsultationPriority,
  {
    label: string
    sectionBg: string
    cardBorderLeft: string
    badge: string
    dot: string
    dotAnimate: boolean
    headerText: string
    headerBg: string
    emptyText: string
  }
> = {
  HIGH: {
    label: 'Alta Prioridad',
    sectionBg: 'bg-red-50/50',
    cardBorderLeft: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    dot: 'bg-red-500',
    dotAnimate: true,
    headerText: 'text-red-700',
    headerBg: 'bg-red-100/60',
    emptyText: 'Sin casos de alta prioridad',
  },
  MODERATE: {
    label: 'Prioridad Moderada',
    sectionBg: 'bg-amber-50/40',
    cardBorderLeft: 'border-l-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    dotAnimate: false,
    headerText: 'text-amber-700',
    headerBg: 'bg-amber-100/60',
    emptyText: 'Sin casos de prioridad moderada',
  },
  LOW: {
    label: 'Baja Prioridad',
    sectionBg: 'bg-emerald-50/30',
    cardBorderLeft: 'border-l-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
    dotAnimate: false,
    headerText: 'text-emerald-700',
    headerBg: 'bg-emerald-100/60',
    emptyText: 'Sin casos de baja prioridad',
  },
}

// ─── AI Summary Drawer ───────────────────────────────────────────────────────

function AiSummaryDrawer({ consultationId }: { consultationId: string }) {
  const { data, isLoading } = useConsultationDetail(consultationId)

  if (isLoading) {
    return (
      <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4">
        {[
          85,
          70,
          55,
        ].map(w => (
          <div key={w} className="h-2.5 animate-pulse rounded-full bg-slate-200" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  const analysis = data?.triage?.analysis
  const answers = data?.triage?.answers ?? []
  const firstAnswer = answers[0]

  return (
    <div className="mt-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
      {/* AI Clinical Summary */}
      {data?.clinicalSummary
        ? (
          <div className="flex gap-2.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
            <p className="text-xs leading-relaxed text-slate-600">{data.clinicalSummary}</p>
          </div>
        )
        : (
          <div className="flex gap-2.5">
            <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
            <p className="text-xs italic text-slate-400">Resumen IA no generado — disponible al atender</p>
          </div>
        )}

      {/* Red Flags */}
      {analysis?.redFlags && analysis.redFlags.length > 0 && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-2.5 space-y-1">
          {analysis.redFlags.map(rf => (
            <div key={rf.evidence} className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
              <p className="text-xs font-semibold text-red-700">{rf.evidence}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main symptom */}
      {firstAnswer && (
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Motivo principal</p>
          <p className="mt-1 text-xs text-slate-700">{String(firstAnswer.answerValue ?? '—')}</p>
        </div>
      )}
    </div>
  )
}

// ─── Consultation Card ────────────────────────────────────────────────────────

function ConsultationCard({
  item,
  onAttend,
  isAttendingThis,
  isAttendingAny,
}: {
  item: QueueItem
  onAttend: (id: string) => void
  isAttendingThis: boolean
  isAttendingAny: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = PRIORITY_CONFIG[item.priority]
  const urgency = waitUrgency(item.createdAt)
  const shortId = item.id.slice(-6).toUpperCase()

  return (
    <div
      className={`rounded-2xl border border-transparent border-l-4 ${cfg.cardBorderLeft} bg-white transition-shadow hover:shadow-[0_4px_24px_rgba(20,184,166,0.10)] ${
        isAttendingThis ? 'ring-2 ring-teal-400 ring-offset-1' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Left: Priority indicator */}
          <div className="mt-1 flex flex-col items-center gap-1.5">
            {cfg.dotAnimate
              ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-50`} />
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                </span>
              )
              : (
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
              )}
            <div className="rounded-lg bg-teal-50 p-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
            </div>
          </div>

          {/* Center: Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {translateSpecialty(item.specialty)}
              </span>
              <span className="ml-auto font-mono text-[11px] font-bold text-slate-300">
                #
                {shortId}
              </span>
            </div>

            {/* Wait time */}
            <div className="mt-2 flex items-center gap-1.5">
              {urgency === 'high'
                ? <Timer className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                : <Clock className="h-3.5 w-3.5 text-slate-400" />}
              <span className={`text-xs font-bold ${
                urgency === 'high'
                  ? 'text-red-600'
                  : urgency === 'medium'
                    ? 'text-amber-600'
                    : 'text-slate-400'
              }`}
              >
                {timeAgo(item.createdAt)}
              </span>
            </div>

            {/* AI toggle */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-teal-600 transition-colors hover:text-teal-700"
            >
              <Sparkles className="h-3 w-3" />
              Ver resumen del triage
              {expanded
                ? <ChevronDown className="h-3 w-3" />
                : <ChevronRight className="h-3 w-3" />}
            </button>

            {expanded && <AiSummaryDrawer consultationId={item.id} />}
          </div>

          {/* Right: CTA */}
          <button
            type="button"
            onClick={() => onAttend(item.id)}
            disabled={isAttendingAny}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              isAttendingThis
                ? 'bg-teal-400 cursor-wait'
                : 'bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5'
            }`}
          >
            {isAttendingThis
              ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Asignando
                </span>
              )
              : 'Atender'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Priority Section ─────────────────────────────────────────────────────────

function PrioritySection({
  priority,
  items,
  onAttend,
  attendingId,
  isAttendingAny,
}: {
  priority: ConsultationPriority
  items: QueueItem[]
  onAttend: (id: string) => void
  attendingId: string | null
  isAttendingAny: boolean
}) {
  const cfg = PRIORITY_CONFIG[priority]

  return (
    <div className={`overflow-hidden rounded-2xl ${cfg.sectionBg}`}>
      <div className={`flex items-center gap-2 px-5 py-3 ${cfg.headerBg}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} ${cfg.dotAnimate ? 'animate-pulse' : ''}`} />
        <h3 className={`text-sm font-black uppercase tracking-wide ${cfg.headerText}`}>
          {cfg.label}
        </h3>
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-black ${cfg.badge}`}>
          {items.length}
        </span>
      </div>

      <div className="p-4">
        {items.length === 0
          ? (
            <p className="py-3 text-center text-sm text-slate-400">{cfg.emptyText}</p>
          )
          : (
            <div className="space-y-3">
              {items.map(item => (
                <ConsultationCard
                  key={item.id}
                  item={item}
                  onAttend={onAttend}
                  isAttendingThis={attendingId === item.id}
                  isAttendingAny={isAttendingAny}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

// ─── KPI Bar ──────────────────────────────────────────────────────────────────

function KpiBar({ total, high, moderate, low }: { total: number, high: number, moderate: number, low: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Total en cola', value: total, color: 'text-slate-900', bar: 'bg-teal-500', pct: 100 },
        { label: 'Alta prioridad', value: high, color: 'text-red-600', bar: 'bg-red-400', pct: total ? (high / total) * 100 : 0 },
        { label: 'Moderada', value: moderate, color: 'text-amber-600', bar: 'bg-amber-400', pct: total ? (moderate / total) * 100 : 0 },
        { label: 'Baja', value: low, color: 'text-emerald-600', bar: 'bg-emerald-400', pct: total ? (low / total) * 100 : 0 },
      ].map(k => (
        <div key={k.label} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(20,184,166,0.06)]">
          <div className="px-4 pt-4 pb-3">
            <p className={`text-2xl font-black leading-none ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{k.label}</p>
          </div>
          <div className="h-1 w-full bg-slate-100">
            <div
              className={`h-1 transition-all duration-500 ${k.bar}`}
              style={{ width: `${k.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function QueueSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2].map(i => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-10 animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            {[1, 2].map(j => (
              <div key={j} className="flex items-start gap-3 rounded-2xl border-l-4 border-l-slate-200 bg-slate-50 p-4">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <div className="h-3.5 w-32 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function DoctorHomePage() {
  const router = useRouter()
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useConsultationQueue()
  const assignMutation = useAssignConsultation()
  const { availability, doctorName, isUpdating, toggle } = useDoctorAvailability()
  const [filterSpecialty, setFilterSpecialty] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<ConsultationPriority | ''>('')
  const [attendingId, setAttendingId] = useState<string | null>(null)

  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  })

  const allItems = data?.items ?? []
  const items = allItems.filter(i =>
    (!filterSpecialty || i.specialty === filterSpecialty)
    && (!filterPriority || i.priority === filterPriority))
  const high = items.filter(i => i.priority === 'HIGH')
  const moderate = items.filter(i => i.priority === 'MODERATE')
  const low = items.filter(i => i.priority === 'LOW')

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : null

  const handleAttend = async (id: string) => {
    setAttendingId(id)
    try {
      await assignMutation.mutateAsync(id)
      router.push(`/doctor/consultations/${id}`)
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible tomar el caso')
      setAttendingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5fbfb]">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-teal-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium text-slate-400">{greeting}</p>
            <h1 className="font-manrope text-xl font-black tracking-tight text-slate-900 leading-none mt-0.5">
              Dr.
              {' '}
              {doctorName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              href="/doctor/history"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
              Historial
            </Link>
            <button
              type="button"
              onClick={toggle}
              disabled={isUpdating}
              title={availability === 'AVAILABLE' ? 'Clic para pausar' : 'Clic para reanudar'}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 ${
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

      <div className="mx-auto max-w-4xl space-y-5 px-6 py-6">

        {/* ── Pausa banner ── */}
        {availability === 'PAUSED' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <PauseCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-700">
              Estás en pausa. Los pacientes seguirán en la cola pero no recibirás nuevas asignaciones automáticas.
            </p>
            <button
              type="button"
              onClick={toggle}
              className="ml-auto shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              Reanudar
            </button>
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Especialidad:</span>
          {([
            '',
            'GENERAL_MEDICINE',
            'ODONTOLOGY',
            'URGENT_CARE',
          ] as const).map(sp => (
            <button
              key={sp}
              type="button"
              onClick={() => setFilterSpecialty(sp)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                filterSpecialty === sp
                  ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {sp === '' ? 'Todas' : translateSpecialty(sp)}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400">Prioridad:</span>
          {([
            '',
            'HIGH',
            'MODERATE',
            'LOW',
          ] as const).map(pr => (
            <button
              key={pr}
              type="button"
              onClick={() => setFilterPriority(pr)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                filterPriority === pr
                  ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {pr === '' ? 'Todas' : pr === 'HIGH' ? 'Alta' : pr === 'MODERATE' ? 'Moderada' : 'Baja'}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[11px] text-slate-400">
                Actualizado
                {lastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              title="Actualizar cola"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── KPI Bar ── */}
        {isLoading
          ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                1,
                2,
                3,
                4,
              ].map(i => (
                <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="px-4 pt-4 pb-3">
                    <div className="h-7 w-10 animate-pulse rounded-lg bg-slate-100" />
                    <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <div className="h-1 w-full bg-slate-100" />
                </div>
              ))}
            </div>
          )
          : (
            <KpiBar
              total={allItems.length}
              high={allItems.filter(i => i.priority === 'HIGH').length}
              moderate={allItems.filter(i => i.priority === 'MODERATE').length}
              low={allItems.filter(i => i.priority === 'LOW').length}
            />
          )}

        {/* ── Error ── */}
        {isError && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="flex-1 text-sm font-semibold text-red-700">
              No se pudo cargar la cola. Verificá tu conexión.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="shrink-0 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Skeleton ── */}
        {isLoading && <QueueSkeleton />}

        {/* ── Empty state ── */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white py-16 text-center shadow-[0_2px_16px_rgba(20,184,166,0.06)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <Stethoscope className="h-8 w-8 text-teal-400" />
            </div>
            <div>
              <p className="font-manrope text-lg font-black text-slate-900">Cola vacía</p>
              <p className="mt-1 text-sm text-slate-400">
                {filterSpecialty || filterPriority
                  ? 'No hay consultas con los filtros aplicados.'
                  : 'No hay consultas pendientes en este momento.'}
              </p>
            </div>
            {(filterSpecialty || filterPriority) && (
              <button
                type="button"
                onClick={() => {
                  setFilterSpecialty('')
                  setFilterPriority('')
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-600"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* ── Priority Sections ── */}
        {!isLoading && !isError && items.length > 0 && (
          <div className="space-y-4">
            {([
              'HIGH',
              'MODERATE',
              'LOW',
            ] as ConsultationPriority[]).map((p) => {
              const list = p === 'HIGH' ? high : p === 'MODERATE' ? moderate : low
              if (list.length === 0 && p !== 'HIGH')
                return null
              return (
                <PrioritySection
                  key={p}
                  priority={p}
                  items={list}
                  onAttend={handleAttend}
                  attendingId={attendingId}
                  isAttendingAny={assignMutation.isPending}
                />
              )
            })}
          </div>
        )}

        {/* ── Footer hint ── */}
        <p className="text-center text-xs text-slate-300">
          Cola actualizada automáticamente cada 30 segundos
        </p>
      </div>
    </div>
  )
}
