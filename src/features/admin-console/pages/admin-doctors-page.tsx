'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { adminService } from '@/features/admin-console/services/admin-service'
import { useDebounce } from '@/hooks/use-debounce'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'VERIFIED', label: 'Verificado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

export function AdminDoctorsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const doctorsQuery = useQuery({
    queryKey: [
      'admin',
      'doctors',
      page,
      statusFilter,
      debouncedSearch,
    ],
    queryFn: () =>
      adminService.listDoctors({
        page,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  })

  const summary = doctorsQuery.data?.summary
  const pagination = doctorsQuery.data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Doctores</h1>
        <p className="text-sm text-slate-500">Revisión REThUS y estado operativo.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-2xl font-black text-slate-900">{summary?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Pendientes</p>
          <p className="text-2xl font-black text-amber-600">{summary?.pending ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Verificados</p>
          <p className="text-2xl font-black text-emerald-600">{summary?.verified ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-400">Rechazados</p>
          <p className="text-2xl font-black text-red-600">{summary?.rejected ?? 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-teal-400"
          />
        </div>
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === opt.value
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        {doctorsQuery.isLoading
          ? (
            <div className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )
          : doctorsQuery.isError
            ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-red-600">No se pudieron cargar los doctores.</p>
                <button
                  type="button"
                  onClick={() => void doctorsQuery.refetch()}
                  className="text-xs text-teal-600 underline"
                >
                  Reintentar
                </button>
              </div>
            )
            : (doctorsQuery.data?.items ?? []).length === 0
              ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">Sin resultados para los filtros seleccionados.</p>
                </div>
              )
              : (
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
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
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
              )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Página
            {' '}
            {page}
            {' '}
            de
            {' '}
            {totalPages}
            {pagination && (
              <>
                {' '}
                ·
                {' '}
                {pagination.total}
                {' '}
                resultados
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-teal-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-teal-300 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
