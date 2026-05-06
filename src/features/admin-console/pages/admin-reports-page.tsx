'use client'

import { useState } from 'react'
import { adminService } from '@/features/admin-console/services/admin-service'

export function AdminReportsPage() {
  const [csv, setCsv] = useState<string | null>(null)

  async function download() {
    const nextCsv = await adminService.exportConsultationsCsv()
    setCsv(nextCsv)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500">Exporte básico de consultas para análisis operativo.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <button
          onClick={() => void download()}
          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white"
        >
          Generar CSV
        </button>
        {csv && (
          <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
            {csv}
          </pre>
        )}
      </div>
    </div>
  )
}
