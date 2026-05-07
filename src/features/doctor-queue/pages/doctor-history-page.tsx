'use client'

import type { ConsultationStatus } from '@/features/doctor-queue/services/consultation-service'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PriorityBadge } from '@/features/doctor-queue/components/priority-badge'
import { useDoctorHistory } from '@/features/doctor-queue/hooks/use-doctor-history'
import { translateSpecialty } from '@/utils/specialty-labels'

const STATUS_CONFIG: Record<ConsultationStatus, { label: string, className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-slate-100 text-slate-600' },
  IN_ATTENTION: { label: 'En atención', className: 'bg-blue-100 text-blue-700' },
  CLOSED: { label: 'Cerrada', className: 'bg-teal-100 text-teal-700' },
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr)
    return '—'
  return new Date(dateStr).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_OPTIONS: { value: string, label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_ATTENTION', label: 'En atención' },
  { value: 'CLOSED', label: 'Cerrada' },
]

export function DoctorHistoryPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading, isError, refetch } = useDoctorHistory(page, statusFilter || undefined)

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  return (
    <div className="min-h-screen bg-[#f5fbfb] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">

        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/doctor"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-xl font-bold text-slate-800">Historial de consultas</h1>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setStatusFilter(opt.value)
                setPage(1)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === opt.value
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">No se pudo cargar el historial.</p>
            <button onClick={() => void refetch()} className="mt-2 text-xs text-teal-600 underline">
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">No hay consultas en el historial.</p>
          </div>
        )}

        {!isLoading && !isError && (data?.items.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Especialidad</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Prioridad</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Resumen</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.items.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status]
                  return (
                    <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {translateSpecialty(item.specialty)}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-500">
                        {item.clinicalSummary
                          ? <span className="line-clamp-1">{item.clinicalSummary}</span>
                          : <span className="italic text-slate-300">Sin resumen</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status !== 'PENDING' && (
                          <Link
                            href={`/doctor/consultations/${item.id}`}
                            className="text-xs font-semibold text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Ver
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-teal-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500">
              Página
              {page}
              {' '}
              de
              {totalPages}
            </span>
            <button
              aria-label="Página siguiente"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-teal-300 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
