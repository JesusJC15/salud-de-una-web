'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PriorityBadge } from '@/features/doctor-queue/components/priority-badge'
import { useAssignConsultation } from '@/features/doctor-queue/hooks/use-assign-consultation'
import { useConsultationQueue } from '@/features/doctor-queue/hooks/use-consultation-queue'
import { translateConsultationStatus } from '@/utils/consultation-status-labels'
import { translateSpecialty } from '@/utils/specialty-labels'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)
    return 'hace un momento'
  if (mins < 60)
    return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)
    return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export function DoctorQueuePage() {
  const router = useRouter()
  const { data, isLoading, isError } = useConsultationQueue()
  const assignMutation = useAssignConsultation()

  const handleTakeCase = async (id: string) => {
    try {
      await assignMutation.mutateAsync(id)
      router.push(`/doctor/consultations/${id}`)
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible tomar el caso')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-500">Error al cargar la cola. Intenta de nuevo.</p>
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Cola de consultas</h1>
        <p className="text-sm text-slate-500">
          {items.length}
          {' '}
          caso
          {items.length !== 1 ? 's' : ''}
          {' '}
          pendiente
          {items.length !== 1 ? 's' : ''}
          {' '}
          — se actualiza cada 30s
        </p>
      </div>

      {items.length === 0
        ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 shadow-sm">
            <p className="text-2xl">✓</p>
            <p className="mt-2 font-semibold text-slate-700">Cola vacía</p>
            <p className="text-sm text-slate-400">No hay consultas pendientes en este momento</p>
          </div>
        )
        : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Prioridad</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Especialidad</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">En cola</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {translateSpecialty(item.specialty)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{translateConsultationStatus(item.status)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.createdAt
                        ? timeAgo(item.createdAt)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleTakeCase(item.id)}
                        disabled={assignMutation.isPending}
                        className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-teal-600 disabled:opacity-50"
                      >
                        Tomar caso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
