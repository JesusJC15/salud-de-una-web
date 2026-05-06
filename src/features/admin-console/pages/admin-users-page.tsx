'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/features/admin-console/services/admin-service'

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers(),
  })
  const toggleMutation = useMutation({
    mutationFn: ({
      role,
      userId,
      isActive,
    }: {
      role: string
      userId: string
      isActive: boolean
    }) => adminService.updateUserActive(role, userId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">Gestión operativa de pacientes, médicos y admins.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Nombre',
                'Correo',
                'Rol',
                'Estado',
                'Acción',
              ].map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(usersQuery.data?.items ?? []).map(item => (
              <tr key={item.id}>
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
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleMutation.mutate({ role: item.role, userId: item.id, isActive: !item.isActive })}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-teal-300 hover:text-teal-600"
                  >
                    {item.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
