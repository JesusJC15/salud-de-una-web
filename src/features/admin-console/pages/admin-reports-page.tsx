'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { adminService } from '@/features/admin-console/services/admin-service'
import { translateSpecialty } from '@/utils/specialty-labels'

const SPECIALTIES = [
  'GENERAL_MEDICINE',
  'ODONTOLOGY',
  'URGENT_CARE',
] as const
const PRIORITIES = [
  'HIGH',
  'MODERATE',
  'LOW',
] as const
const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'Alta',
  MODERATE: 'Moderada',
  LOW: 'Baja',
}

export function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [priority, setPriority] = useState('')

  async function handleDownload() {
    setIsLoading(true)
    try {
      const csv = await adminService.exportConsultationsCsv({
        from: from || undefined,
        to: to || undefined,
        specialty: specialty || undefined,
        priority: priority || undefined,
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `consultas-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible exportar el reporte')
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">Exportá el historial de consultas con filtros opcionales.</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-slate-800">Exportar consultas (CSV)</h2>
        <p className="mb-5 text-xs text-slate-400">
          Todos los filtros son opcionales. Sin filtros se exportan todas las consultas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="report-from" className="mb-1 block text-xs font-semibold text-slate-500">
              Desde
            </label>
            <input
              id="report-from"
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="report-to" className="mb-1 block text-xs font-semibold text-slate-500">
              Hasta
            </label>
            <input
              id="report-to"
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              min={from || undefined}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="report-specialty" className="mb-1 block text-xs font-semibold text-slate-500">
              Especialidad
            </label>
            <select
              id="report-specialty"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            >
              <option value="">Todas</option>
              {SPECIALTIES.map(s => (
                <option key={s} value={s}>{translateSpecialty(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-priority" className="mb-1 block text-xs font-semibold text-slate-500">
              Prioridad
            </label>
            <select
              id="report-priority"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-400 focus:outline-none"
            >
              <option value="">Todas</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>

        {(from || to || specialty || priority) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {from && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                Desde:
                {' '}
                {from}
              </span>
            )}
            {to && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                Hasta:
                {' '}
                {to}
              </span>
            )}
            {specialty && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                {translateSpecialty(specialty)}
              </span>
            )}
            {priority && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                Prioridad:
                {' '}
                {PRIORITY_LABELS[priority]}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setFrom('')
                setTo('')
                setSpecialty('')
                setPriority('')
              }}
              className="text-xs font-semibold text-slate-400 underline hover:text-slate-600"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isLoading}
            className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-60"
          >
            {isLoading ? 'Generando...' : 'Descargar CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
