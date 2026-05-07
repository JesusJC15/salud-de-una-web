'use client'

import type { ConsultationPriority, QueueItem } from '@/features/doctor-queue/services/consultation-service'
import { useAuth0 } from '@auth0/auth0-react'
import { AlertTriangle, Brain, ChevronDown, ChevronRight, Clock, LogOut, PauseCircle, Sparkles, Stethoscope, Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { NotificationBell } from '@/components/notification-bell'
import { authService } from '@/services/auth-service'
import { useAssignConsultation } from '@/features/doctor-queue/hooks/use-assign-consultation'
import { useConsultationDetail } from '@/features/doctor-queue/hooks/use-consultation-detail'
import { useConsultationQueue } from '@/features/doctor-queue/hooks/use-consultation-queue'
import { useDoctorAvailability } from '@/features/doctor-queue/hooks/use-doctor-availability'
import { translateSpecialty } from '@/utils/specialty-labels'

// ─── helpers ───────────────────────────────────────────────────────────────

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

// ─── Priority config ────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  ConsultationPriority,
  {
    label: string
    sectionBg: string
    cardBorder: string
    badge: string
    dot: string
    headerText: string
    emptyText: string
  }
> = {
  HIGH: {
    label: 'Alta Prioridad',
    sectionBg: 'bg-red-50/60',
    cardBorder: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    headerText: 'text-red-700',
    emptyText: 'Sin casos de alta prioridad',
  },
  MODERATE: {
    label: 'Prioridad Moderada',
    sectionBg: 'bg-amber-50/60',
    cardBorder: 'border-l-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    headerText: 'text-amber-700',
    emptyText: 'Sin casos de prioridad moderada',
  },
  LOW: {
    label: 'Baja Prioridad',
    sectionBg: 'bg-emerald-50/40',
    cardBorder: 'border-l-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
    headerText: 'text-emerald-700',
    emptyText: 'Sin casos de baja prioridad',
  },
}

// ─── Expandable AI Summary ──────────────────────────────────────────────────

function AiSummaryDrawer({ consultationId }: { consultationId: string }) {
  const { data, isLoading } = useConsultationDetail(consultationId)

  if (isLoading) {
    return (
      <div className="mt-3 space-y-2 rounded-xl bg-white/80 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </div>
    )
  }

  const analysis = data?.triage?.analysis
  const answers = data?.triage?.answers ?? []

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-white/80 p-4">
      {/* AI Clinical Summary */}
      {data?.clinicalSummary
        ? (
          <div className="flex gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
            <p className="text-xs leading-relaxed text-slate-600">{data.clinicalSummary}</p>
          </div>
        )
        : (
          <div className="flex gap-2">
            <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
            <p className="text-xs text-slate-400 italic">Resumen IA no generado aún — disponible al atender</p>
          </div>
        )}

      {/* Red Flags */}
      {analysis?.redFlags && analysis.redFlags.length > 0 && (
        <div className="space-y-1">
          {analysis.redFlags.map((rf, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
              <p className="text-xs font-semibold text-red-700">{rf.evidence}</p>
            </div>
          ))}
        </div>
      )}

      {/* Key answers preview */}
      {answers.length > 0 && (
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Motivo principal</p>
          <p className="text-xs text-slate-600">{String(answers[0]?.answerValue ?? '—')}</p>
        </div>
      )}
    </div>
  )
}

// ─── Consultation Card ──────────────────────────────────────────────────────

function ConsultationCard({
  item,
  onAttend,
  isAttending,
}: {
  item: QueueItem
  onAttend: (id: string) => void
  isAttending: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = PRIORITY_CONFIG[item.priority]
  const urgency = waitUrgency(item.createdAt)
  const shortId = item.id.slice(-6).toUpperCase()

  return (
    <div
      className={`rounded-2xl border-l-4 ${cfg.cardBorder} bg-white p-5 shadow-[0_2px_16px_rgba(20,184,166,0.06)] transition-shadow hover:shadow-[0_4px_24px_rgba(20,184,166,0.10)]`}
    >
      <div className="flex items-start gap-4">
        {/* Priority dot + specialty icon */}
        <div className="flex flex-col items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${cfg.dot} shadow-sm`} />
          <div className="rounded-xl bg-teal-50 p-2">
            <Stethoscope className="h-4 w-4 text-teal-600" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {translateSpecialty(item.specialty)}
            </span>
            <span className="ml-auto text-xs font-bold text-slate-400">
              #
              {shortId}
            </span>
          </div>

          {/* Wait time */}
          <div className="mt-2 flex items-center gap-1.5">
            {urgency === 'high'
              ? (
                <Timer className="h-3.5 w-3.5 text-red-500" />
              )
              : (
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              )}
            <span className={`text-xs font-bold ${urgency === 'high' ? 'text-red-500' : urgency === 'medium' ? 'text-amber-500' : 'text-slate-400'}`}>
              {timeAgo(item.createdAt)}
            </span>
          </div>

          {/* AI Summary toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-teal-600 transition-colors hover:text-teal-700"
          >
            <Sparkles className="h-3 w-3" />
            Ver resumen del triage
            {expanded
              ? (
                <ChevronDown className="h-3 w-3" />
              )
              : (
                <ChevronRight className="h-3 w-3" />
              )}
          </button>

          {expanded && <AiSummaryDrawer consultationId={item.id} />}
        </div>

        {/* Action */}
        <button
          onClick={() => onAttend(item.id)}
          disabled={isAttending}
          className="shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-teal-500/20 transition-all hover:shadow-teal-500/30 hover:-translate-y-0.5 disabled:opacity-50"
        >
          {isAttending ? '...' : 'Atender'}
        </button>
      </div>
    </div>
  )
}

// ─── Priority Section ────────────────────────────────────────────────────────

function PrioritySection({
  priority,
  items,
  onAttend,
  isAttending,
}: {
  priority: ConsultationPriority
  items: QueueItem[]
  onAttend: (id: string) => void
  isAttending: boolean
}) {
  const cfg = PRIORITY_CONFIG[priority]

  return (
    <div className={`rounded-2xl p-5 ${cfg.sectionBg}`}>
      <div className="mb-4 flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
        <h3 className={`font-manrope text-sm font-black uppercase tracking-wide ${cfg.headerText}`}>
          {cfg.label}
        </h3>
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-black ${cfg.badge}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0
        ? (
          <p className="py-4 text-center text-sm text-slate-400">{cfg.emptyText}</p>
        )
        : (
          <div className="space-y-3">
            {items.map(item => (
              <ConsultationCard
                key={item.id}
                item={item}
                onAttend={onAttend}
                isAttending={isAttending}
              />
            ))}
          </div>
        )}
    </div>
  )
}

// ─── KPI Bar ─────────────────────────────────────────────────────────────────

function KpiBar({ total, high, moderate, low }: { total: number, high: number, moderate: number, low: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Total en cola', value: total, color: 'text-slate-900' },
        { label: 'Alta prioridad', value: high, color: 'text-red-600' },
        { label: 'Moderada', value: moderate, color: 'text-amber-600' },
        { label: 'Baja', value: low, color: 'text-emerald-600' },
      ].map(k => (
        <div key={k.label} className="rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(20,184,166,0.06)]">
          <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">{k.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DoctorHomePage() {
  const { user } = useAuth0()
  const router = useRouter()
  const { data, isLoading, isError } = useConsultationQueue()
  const assignMutation = useAssignConsultation()
  const { availability, isUpdating, toggle } = useDoctorAvailability()
  const [filterSpecialty, setFilterSpecialty] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<ConsultationPriority | ''>('')

  const allItems = data?.items ?? []
  const items = allItems.filter(i =>
    (!filterSpecialty || i.specialty === filterSpecialty)
    && (!filterPriority || i.priority === filterPriority))
  const high = items.filter(i => i.priority === 'HIGH')
  const moderate = items.filter(i => i.priority === 'MODERATE')
  const low = items.filter(i => i.priority === 'LOW')

  const handleAttend = async (id: string) => {
    await assignMutation.mutateAsync(id)
    router.push(`/doctor/consultations/${id}`)
  }

  const doctorName = user?.name?.split(' ')[0] ?? 'Doctor'
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  })

  return (
    <div className="min-h-screen bg-[#f5fbfb]">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-teal-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium text-slate-400">
              {greeting}
              ,
            </p>
            <h1 className="font-manrope text-xl font-black tracking-tight text-slate-900">
              Dr.
              {' '}
              {doctorName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <a
              href="/doctor/history"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
              Historial
            </a>
            <button
              onClick={toggle}
              disabled={isUpdating}
              title={availability === 'AVAILABLE' ? 'Clic para pausar' : 'Clic para reanudar'}
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

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">

        {/* ── Pausa banner ── */}
        {availability === 'PAUSED' && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <PauseCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-700">
              Estás en pausa. Los pacientes seguirán en la cola pero no recibirás nuevas asignaciones automáticas.
            </p>
            <button onClick={toggle} className="ml-auto text-xs font-bold text-amber-700 underline hover:text-amber-900">
              Reanudar
            </button>
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filtrar:</span>
          {([
            '',
            'GENERAL_MEDICINE',
            'ODONTOLOGY',
          ] as const).map(sp => (
            <button
              key={sp}
              onClick={() => setFilterSpecialty(sp)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filterSpecialty === sp
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {sp === '' ? 'Todas las especialidades' : translateSpecialty(sp)}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-slate-200" />
          {([
            '',
            'HIGH',
            'MODERATE',
            'LOW',
          ] as const).map(pr => (
            <button
              key={pr}
              onClick={() => setFilterPriority(pr)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filterPriority === pr
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {pr === '' ? 'Toda prioridad' : pr === 'HIGH' ? 'Alta' : pr === 'MODERATE' ? 'Moderada' : 'Baja'}
            </button>
          ))}
        </div>

        {/* ── KPI Bar ── */}
        {isLoading
          ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
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
          <div className="rounded-2xl bg-red-50 p-4 text-center">
            <p className="text-sm font-semibold text-red-600">
              No se pudo cargar la cola. Verificá tu conexión.
            </p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-2xl bg-white py-16 text-center shadow-[0_2px_16px_rgba(20,184,166,0.06)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <Stethoscope className="h-7 w-7 text-teal-500" />
            </div>
            <p className="font-manrope text-lg font-black text-slate-900">Cola vacía</p>
            <p className="mt-1 text-sm text-slate-400">
              No hay consultas pendientes en este momento
            </p>
          </div>
        )}

        {/* ── Priority Sections ── */}
        {!isLoading && items.length > 0 && (
          <div className="space-y-5">
            {([
              'HIGH',
              'MODERATE',
              'LOW',
            ] as ConsultationPriority[]).map((p) => {
              const list = { HIGH: high, MODERATE: moderate, LOW: low }[p]
              if (list.length === 0 && p !== 'HIGH')
                return null // always show HIGH
              return (
                <PrioritySection
                  key={p}
                  priority={p}
                  items={list}
                  onAttend={handleAttend}
                  isAttending={assignMutation.isPending}
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
