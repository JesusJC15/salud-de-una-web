import type { DoctorReviewItem } from '@/types'
import { Button } from '@/components/ui/button'
import { translateSpecialty } from '@/utils/specialty-labels'

interface DoctorVerificationTableProps {
  doctors: DoctorReviewItem[]
  isLoading: boolean
  onReject: (id: string) => void
  onVerify: (id: string) => void
}

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function DoctorVerificationTable({
  doctors,
  isLoading,
  onReject,
  onVerify,
}: DoctorVerificationTableProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando medicos pendientes...</p>
      </section>
    )
  }

  if (doctors.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">No hay medicos PENDING</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Todos los registros fueron procesados.</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-4 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Nombre completo</th>
              <th className="px-4 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Especialidad</th>
              <th className="px-4 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Rethus number</th>
              <th className="px-4 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Fecha de registro</th>
              <th className="px-4 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {doctors.map((doctor) => {
              const fullName = `${doctor.firstName} ${doctor.lastName}`.trim()
              const rethusNumber = doctor.rethusNumber ?? doctor.professionalLicense ?? '-'

              return (
                <tr key={doctor.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{fullName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{translateSpecialty(doctor.specialty)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{rethusNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(doctor.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => onVerify(doctor.id)}>
                        Verificar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onReject(doctor.id)}>
                        Rechazar
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
