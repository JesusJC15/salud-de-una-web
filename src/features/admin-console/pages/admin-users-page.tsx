'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { adminService } from '@/features/admin-console/services/admin-service'
import { useDebounce } from '@/hooks/use-debounce'

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PATIENT', label: 'Pacientes' },
  { value: 'DOCTOR', label: 'Médicos' },
  { value: 'ADMIN', label: 'Admins' },
]

const SKELETON_ROW_KEYS = [
  'skeleton-row-1',
  'skeleton-row-2',
  'skeleton-row-3',
  'skeleton-row-4',
  'skeleton-row-5',
  'skeleton-row-6',
]

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const usersQuery = useQuery({
    queryKey: [
      'admin',
      'users',
      page,
      roleFilter,
      debouncedSearch,
    ],
    queryFn: () =>
      adminService.listUsers({
        page,
        role: roleFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ role, userId, isActive }: { role: string, userId: string, isActive: boolean }) =>
      adminService.updateUserActive(role, userId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al actualizar el estado del usuario')
    },
  })

  const pagination = usersQuery.data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  function handleRoleChange(value: string) {
    setRoleFilter(value)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Gestión operativa de pacientes, médicos y admins.</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
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
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleRoleChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === opt.value
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
        {usersQuery.isLoading
          ? (
            <div className="divide-y divide-slate-50">
              {SKELETON_ROW_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          )
          : usersQuery.isError
            ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-red-600">No se pudieron cargar los usuarios.</p>
                <button
                  type="button"
                  onClick={() => void usersQuery.refetch()}
                  className="text-xs text-teal-600 underline"
                >
                  Reintentar
                </button>
              </div>
            )
            : (usersQuery.data?.items ?? []).length === 0
              ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">Sin resultados para los filtros seleccionados.</p>
                </div>
              )
              : (
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Nombre',
                        'Correo',
                        'Rol',
                        'Estado',
                      ].map(header => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                          {header}
                        </th>
                      ))}
                      {/* Columna Sticky en Header */}
                      <th className="sticky right-0 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase text-slate-500 border-b border-slate-100 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(usersQuery.data?.items ?? []).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.firstName}
                          {' '}
                          {item.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.email}</td>
                        <td className="px-4 py-3 text-slate-500">{item.role}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {item.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {/* Columna Sticky en Body */}
                        <td className="sticky right-0 bg-white px-4 py-3 group-hover:bg-slate-50 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                          <button
                            type="button"
                            onClick={() => toggleMutation.mutate({ role: item.role, userId: item.id, isActive: !item.isActive })}
                            disabled={toggleMutation.isPending}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-teal-300 hover:text-teal-600 disabled:opacity-50 bg-white"
                          >
                            {item.isActive ? 'Desactivar' : 'Activar'}
                          </button>
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
