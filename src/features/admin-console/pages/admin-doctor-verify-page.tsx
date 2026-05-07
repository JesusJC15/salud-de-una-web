'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { adminService } from '@/features/admin-console/services/admin-service'

export function AdminDoctorVerifyPage({ doctorId }: { doctorId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  const doctorsQuery = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () => adminService.listDoctors(),
  })

  const doctor = (doctorsQuery.data?.items ?? []).find(item => item.id === doctorId)

  const verifyMutation = useMutation({
    mutationFn: (action: 'APPROVE' | 'REJECT') =>
      adminService.verifyDoctor(doctorId, {
        action,
        notes: notes.trim() || undefined,
        evidenceUrl: evidenceUrl.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Verificación registrada correctamente')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
      router.push('/admin/doctors')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al registrar la verificación')
    },
  })

  if (doctorsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Doctor no encontrado.</p>
      </div>
    )
  }

  const isPending = verifyMutation.isPending

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/doctors')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Volver
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Validación REThUS</h1>
          <p className="text-sm text-slate-500">
            {doctor.firstName}
            {' '}
            {doctor.lastName}
            {' '}
            ·
            {' '}
            {doctor.email}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-slate-600">
          <div>
            <span className="font-semibold text-slate-900">Documento:</span>
            {' '}
            {doctor.personalId}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Especialidad:</span>
            {' '}
            {doctor.specialty}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Estado actual:</span>
            {' '}
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
              doctor.doctorStatus === 'PENDING'
                ? 'bg-amber-100 text-amber-700'
                : doctor.doctorStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
            }`}
            >
              {doctor.doctorStatus}
            </span>
          </div>
          {doctor.latestVerification && (
            <div>
              <span className="font-semibold text-slate-900">Última revisión:</span>
              {' '}
              {doctor.latestVerification.rethusState}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="evidence-url" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
              URL de evidencia (opcional)
            </label>
            <input
              id="evidence-url"
              type="url"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label htmlFor="review-notes" className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
              Notas de revisión (opcional)
            </label>
            <textarea
              id="review-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones sobre la verificación..."
              className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => verifyMutation.mutate('APPROVE')}
            disabled={isPending}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Procesando...' : 'Aprobar'}
          </button>
          <button
            type="button"
            onClick={() => verifyMutation.mutate('REJECT')}
            disabled={isPending}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Procesando...' : 'Rechazar'}
          </button>
        </div>
      </div>
    </div>
  )
}
