'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminService } from '@/features/admin-console/services/admin-service'

export function AdminDoctorVerifyPage({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const doctorsQuery = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () => adminService.listDoctors(),
  })
  const doctor = (doctorsQuery.data?.items ?? []).find(item => item.id === doctorId)
  const verifyMutation = useMutation({
    mutationFn: (action: 'APPROVE' | 'REJECT') =>
      adminService.verifyDoctor(doctorId, { action, notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
    },
  })

  if (!doctor) {
    return <div className="p-6 text-sm text-slate-500">Doctor no encontrado.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
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

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">Documento:</span>
            {' '}
            {doctor.personalId}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Especialidad:</span>
            {' '}
            {doctor.specialty}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Estado actual:</span>
            {' '}
            {doctor.doctorStatus}
          </p>
        </div>
        <textarea
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Notas de revisión"
          className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-hidden focus:border-teal-400"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => verifyMutation.mutate('APPROVE')}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
          >
            Aprobar
          </button>
          <button
            onClick={() => verifyMutation.mutate('REJECT')}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  )
}
