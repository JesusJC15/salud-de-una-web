'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { adminService } from '@/features/admin-console/services/admin-service'

export function AdminDoctorsPage() {
  const doctorsQuery = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () => adminService.listDoctors(),
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Doctores</h1>
        <p className="text-sm text-slate-500">Revisión REThUS y estado operativo.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-2xl font-black text-slate-900">{doctorsQuery.data?.summary.total ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Pendientes</p>
          <p className="text-2xl font-black text-amber-600">{doctorsQuery.data?.summary.pending ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Verificados</p>
          <p className="text-2xl font-black text-emerald-600">{doctorsQuery.data?.summary.verified ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Rechazados</p>
          <p className="text-2xl font-black text-red-600">{doctorsQuery.data?.summary.rejected ?? 0}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Doctor',
                'Especialidad',
                'Estado',
                'Última verificación',
                'Acción',
              ].map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(doctorsQuery.data?.items ?? []).map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {item.firstName}
                    {' '}
                    {item.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{item.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-500">{item.specialty}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.doctorStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : item.doctorStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                  >
                    {item.doctorStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {item.latestVerification?.rethusState ?? 'Sin revisión'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/doctors/${item.id}/verify`}
                    className="text-xs font-bold text-teal-600 hover:underline"
                  >
                    Revisar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
