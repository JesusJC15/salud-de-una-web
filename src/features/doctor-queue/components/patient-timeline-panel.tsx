'use client'

import { Calendar, ChevronRight, RefreshCcw, Route } from 'lucide-react'
import { ApiErrorState } from '@/components/api-error-state'
import { usePatientTimeline } from '@/features/doctor-queue/hooks/use-patient-timeline'

const EVENT_COLORS: Record<string, string> = {
  TRIAGE_COMPLETED: 'bg-cyan-100 text-cyan-700',
  CONSULTATION_ASSIGNED: 'bg-blue-100 text-blue-700',
  CONSULTATION_CLOSED: 'bg-teal-100 text-teal-700',
  FOLLOWUP_CREATED: 'bg-amber-100 text-amber-700',
  FOLLOWUP_DUE: 'bg-orange-100 text-orange-700',
  FOLLOWUP_COMPLETED: 'bg-emerald-100 text-emerald-700',
  PRIORITY_ESCALATED: 'bg-red-100 text-red-700',
}

const TIMELINE_SKELETON_KEYS = [
  'timeline-skeleton-1',
  'timeline-skeleton-2',
  'timeline-skeleton-3',
  'timeline-skeleton-4',
]

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PatientTimelinePanel({ patientId }: { patientId: string }) {
  const timelineQuery = usePatientTimeline(patientId)
  const items = timelineQuery.data?.pages.flatMap(page => page.items) ?? []

  return (
    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_45px_rgba(15,118,110,0.08)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-cyan-50 p-2 text-cyan-600">
            <Route className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-950">Timeline del paciente</h4>
            <p className="text-xs text-slate-400">Eventos clínicos y de seguimiento</p>
          </div>
        </div>
        <button
          onClick={() => void timelineQuery.refetch()}
          aria-label="Actualizar timeline"
          title="Actualizar timeline"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-teal-300 hover:text-teal-600"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      {timelineQuery.isLoading
        ? (
          <div className="space-y-2">
            {TIMELINE_SKELETON_KEYS.map(skeletonKey => (
              <div key={skeletonKey} className="h-14 animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        )
        : timelineQuery.isError
          ? (
            <ApiErrorState
              error={timelineQuery.error}
              title="No se pudo cargar el timeline"
              onRetry={() => void timelineQuery.refetch()}
            />
          )
          : items.length === 0
            ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                Sin eventos de timeline todavía.
              </div>
            )
            : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 bg-white/70 p-3 transition-colors hover:border-teal-100 hover:bg-teal-50/30">
                    <div className={`mt-0.5 h-fit rounded-full px-2 py-1 text-[10px] font-black ${EVENT_COLORS[item.type] ?? 'bg-slate-100 text-slate-700'}`}>
                      {item.type.replaceAll('_', ' ')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.subtitle}</p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.occurredAt)}
                      </div>
                    </div>
                    {item.resourceId && (
                      <ChevronRight className="mt-3 h-4 w-4 text-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            )}

      {timelineQuery.hasNextPage && (
        <button
          onClick={() => void timelineQuery.fetchNextPage()}
          disabled={timelineQuery.isFetchingNextPage}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-600 disabled:opacity-50"
        >
          {timelineQuery.isFetchingNextPage ? 'Cargando...' : 'Ver más'}
        </button>
      )}
    </div>
  )
}
