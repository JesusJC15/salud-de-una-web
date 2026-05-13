'use client'

import type { Resolver } from 'react-hook-form'
import type { RethusVerifyFormValues } from '../validators/rethus-verify-schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ApiErrorState } from '@/components/api-error-state'
import { LoadingState } from '@/components/loading-state'
import { adminService } from '@/features/admin-console/services/admin-service'
import { ProgramType, RethusState, TitleObtainingOrigin } from '@/types/enums'
import { PROGRAM_TYPE_LABELS } from '@/utils/program-type-labels'
import { RETHUS_STATE_LABELS } from '@/utils/rethus-state-labels'
import { TITLE_OBTAINING_ORIGIN_LABELS } from '@/utils/title-obtaining-origin-labels'
import { rethusVerifySchema } from '../validators/rethus-verify-schema'

const fieldClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400'
const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500'

const rethusResolver: Resolver<RethusVerifyFormValues> = async (values) => {
  const result = rethusVerifySchema.safeParse(values)
  if (result.success) {
    return { values: result.data, errors: {} }
  }

  return {
    values: {},
    errors: result.error.issues.reduce<Record<string, { message: string, type: string }>>(
      (acc, issue) => {
        acc[issue.path.join('.')] = { message: issue.message, type: issue.code }
        return acc
      },
      {},
    ),
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function AdminDoctorVerifyPage({ doctorId }: { doctorId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const doctorQuery = useQuery({
    queryKey: [
      'admin',
      'doctor-review',
      doctorId,
    ],
    queryFn: () => adminService.getDoctorReview(doctorId),
    retry: false,
  })

  const defaultValues = useMemo<RethusVerifyFormValues>(() => ({
    administrativeAct: '',
    evidenceUrl: '',
    notes: '',
    professionOccupation: '',
    programType: ProgramType.UNIVERSITY,
    reportingEntity: '',
    rethusState: RethusState.VALID,
    startDate: todayIsoDate(),
    titleObtainingOrigin: TitleObtainingOrigin.LOCAL,
  }), [])

  const form = useForm<RethusVerifyFormValues>({
    resolver: rethusResolver,
    defaultValues,
    mode: 'onBlur',
  })

  const verifyMutation = useMutation({
    mutationFn: (input: RethusVerifyFormValues) =>
      adminService.verifyDoctor(doctorId, {
        ...input,
        evidenceUrl: input.evidenceUrl?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Verificación REThUS registrada correctamente')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
      void queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'doctor-review',
          doctorId,
        ],
      })
      router.push('/admin/doctors')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al registrar la verificación')
    },
  })

  if (doctorQuery.isLoading) {
    return <LoadingState label="Cargando doctor..." />
  }

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ApiErrorState
          error={doctorQuery.error}
          title="Doctor no encontrado"
          onRetry={() => void doctorQuery.refetch()}
        />
      </div>
    )
  }

  const doctor = doctorQuery.data
  const errors = form.formState.errors

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/doctors')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Volver
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Validación REThUS completa</h1>
          <p className="text-sm text-slate-500">
            {doctor.firstName}
            {' '}
            {doctor.lastName}
            {' · '}
            {doctor.email}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
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
          <p>
            <span className="font-semibold text-slate-900">Última revisión:</span>
            {' '}
            {doctor.latestVerification?.rethusState ?? 'Sin revisión'}
          </p>
        </div>
      </div>

      <form
        className="rounded-2xl bg-white p-5 shadow-sm"
        onSubmit={form.handleSubmit(values => verifyMutation.mutate(values))}
      >
        <div className="mb-5">
          <h2 className="text-base font-black text-slate-900">Datos verificatorios</h2>
          <p className="mt-1 text-sm text-slate-500">
            Para aprobar o rechazar un médico nuevo se registran todos los campos auditables de REThUS.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Tipo de programa</span>
            <select {...form.register('programType')} className={fieldClass}>
              {Object.values(ProgramType).map(value => (
                <option key={value} value={value}>{PROGRAM_TYPE_LABELS[value]}</option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Origen del título</span>
            <select {...form.register('titleObtainingOrigin')} className={fieldClass}>
              {Object.values(TitleObtainingOrigin).map(value => (
                <option key={value} value={value}>{TITLE_OBTAINING_ORIGIN_LABELS[value]}</option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Profesión u ocupación</span>
            <input {...form.register('professionOccupation')} className={fieldClass} />
            {errors.professionOccupation ? <p className="mt-1 text-xs text-red-600">{errors.professionOccupation.message}</p> : null}
          </label>

          <label>
            <span className={labelClass}>Fecha de inicio</span>
            <input type="date" {...form.register('startDate')} className={fieldClass} />
            {errors.startDate ? <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p> : null}
          </label>

          <label>
            <span className={labelClass}>Estado REThUS</span>
            <select {...form.register('rethusState')} className={fieldClass}>
              {Object.values(RethusState).map(value => (
                <option key={value} value={value}>{RETHUS_STATE_LABELS[value]}</option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Acto administrativo</span>
            <input {...form.register('administrativeAct')} className={fieldClass} />
            {errors.administrativeAct ? <p className="mt-1 text-xs text-red-600">{errors.administrativeAct.message}</p> : null}
          </label>

          <label>
            <span className={labelClass}>Entidad reportante</span>
            <input {...form.register('reportingEntity')} className={fieldClass} />
            {errors.reportingEntity ? <p className="mt-1 text-xs text-red-600">{errors.reportingEntity.message}</p> : null}
          </label>

          <label>
            <span className={labelClass}>URL de evidencia</span>
            <input type="url" {...form.register('evidenceUrl')} className={fieldClass} placeholder="https://..." />
            {errors.evidenceUrl ? <p className="mt-1 text-xs text-red-600">{errors.evidenceUrl.message}</p> : null}
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Notas</span>
          <textarea {...form.register('notes')} className={`${fieldClass} min-h-28`} />
          {errors.notes ? <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p> : null}
        </label>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/doctors')}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {verifyMutation.isPending ? 'Guardando...' : 'Guardar verificación'}
          </button>
        </div>
      </form>
    </div>
  )
}
