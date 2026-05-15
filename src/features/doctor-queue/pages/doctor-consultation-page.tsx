'use client'

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Loader2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ApiErrorState } from '@/components/api-error-state'
import { ChatPanel } from '@/features/doctor-queue/components/chat-panel'
import { ClinicalSummaryPanel } from '@/features/doctor-queue/components/clinical-summary-panel'
import { PatientTimelinePanel } from '@/features/doctor-queue/components/patient-timeline-panel'
import { PriorityBadge } from '@/features/doctor-queue/components/priority-badge'
import { useChatSocket } from '@/features/doctor-queue/hooks/use-chat-socket'
import { useCloseConsultation } from '@/features/doctor-queue/hooks/use-close-consultation'
import { useConsultationDetail } from '@/features/doctor-queue/hooks/use-consultation-detail'
import { useGenerateSummary } from '@/features/doctor-queue/hooks/use-generate-summary'
import { useSummaryFeedback } from '@/features/doctor-queue/hooks/use-summary-feedback'
import { useSession } from '@/providers/session-context'
import { translateConsultationStatus } from '@/utils/consultation-status-labels'
import { translateSpecialty } from '@/utils/specialty-labels'

interface Props { consultationId: string }

function formatDate(value?: string | null) {
  if (!value)
    return 'Sin registro'
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function minutesWaiting(value?: string | null) {
  if (!value)
    return 'Sin tiempo'
  const mins = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60_000), 0)
  if (mins < 1)
    return 'Recién asignada'
  if (mins < 60)
    return `${mins} min desde ingreso`
  return `${Math.floor(mins / 60)}h ${mins % 60}min desde ingreso`
}

function ConsultationSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5fbfb] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-24 animate-pulse rounded-2xl bg-white/80" />
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-[620px] animate-pulse rounded-2xl bg-white/80" />
            <div className="h-[620px] animate-pulse rounded-2xl bg-white/80" />
          </div>
          <div className="h-[620px] animate-pulse rounded-2xl bg-white/80" />
        </div>
      </div>
    </div>
  )
}

export function DoctorConsultationPage({ consultationId }: Props) {
  const router = useRouter()
  const session = useSession()
  const doctorId = session?.id ?? null

  const [baselineSymptomSeverity, setBaselineSymptomSeverity] = useState(5)
  const [redFlagsConfirmed, setRedFlagsConfirmed] = useState(false)
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false)

  const consultationQuery = useConsultationDetail(consultationId)
  const consultation = consultationQuery.data
  const generateSummaryMutation = useGenerateSummary(consultationId)
  const closeConsultationMutation = useCloseConsultation(consultationId)
  const summaryFeedbackMutation = useSummaryFeedback(consultationId)
  const { messages, status: socketStatus, sendMessage } = useChatSocket(
    consultation?.status === 'IN_ATTENTION' ? consultationId : null,
    doctorId,
  )

  const redFlags = consultation?.triage?.analysis?.redFlags ?? []
  const isClosed = consultation?.status === 'CLOSED'
  const canClose = consultation?.status === 'IN_ATTENTION'

  const primaryAnswer = useMemo(() => {
    const answers = consultation?.triage?.answers ?? []
    const firstTextAnswer = answers.find(answer => typeof answer.answerValue === 'string' && answer.answerValue.trim())
    return firstTextAnswer ?? answers[0]
  }, [consultation?.triage?.answers])

  const handleClose = async () => {
    const closePromise = closeConsultationMutation.mutateAsync({
      baselineSymptomSeverity,
      redFlagsConfirmed,
    })

    try {
      await toast.promise(closePromise, {
        loading: 'Cerrando consulta clinica...',
        success: 'Consulta cerrada. Se notifico al paciente.',
        error: error => error instanceof Error ? error.message : 'No fue posible cerrar la consulta',
      })
      router.push('/doctor/queue')
    }
    catch {
      // toast.promise already surfaced the actionable error to the doctor.
    }
    finally {
      setCloseConfirmationOpen(false)
    }
  }

  const handleGenerateSummary = () => {
    void toast.promise(generateSummaryMutation.mutateAsync(), {
      loading: 'Generando resumen clinico con IA...',
      success: 'Resumen clinico actualizado',
      error: error => error instanceof Error ? error.message : 'No fue posible generar el resumen',
    })
  }

  if (consultationQuery.isLoading) {
    return <ConsultationSkeleton />
  }

  if (consultationQuery.isError) {
    return (
      <div className="min-h-screen bg-[#f5fbfb] px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <ApiErrorState
            error={consultationQuery.error}
            title="No se pudo abrir la consulta"
            message="La consulta puede haber sido reasignada, cerrada o tu sesion no tiene permiso para verla."
            onRetry={() => void consultationQuery.refetch()}
          />
        </div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5fbfb] px-6">
        <div className="rounded-2xl border border-slate-100 bg-white px-8 py-10 text-center shadow-sm">
          <Stethoscope className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Consulta no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5fbfb] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_16px_50px_rgba(15,118,110,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => router.push('/doctor/queue')}
                className="mb-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Cola priorizada
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={consultation.priority} />
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                  {translateSpecialty(consultation.specialty)}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {translateConsultationStatus(consultation.status)}
                </span>
                {redFlags.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {redFlags.length}
                    {' '}
                    red flag
                    {redFlags.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Consulta clinica
                {' '}
                <span className="font-mono text-slate-400">
                  #
                  {consultation.id.slice(-6).toUpperCase()}
                </span>
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
                {primaryAnswer
                  ? String(primaryAnswer.answerValue)
                  : 'Sin motivo principal registrado en el triage.'}
              </p>
            </div>

            <div className="grid min-w-72 grid-cols-3 gap-2">
              <div className="rounded-xl bg-teal-50 px-3 py-3">
                <Clock3 className="h-4 w-4 text-teal-600" />
                <p className="mt-2 text-[11px] font-bold uppercase text-teal-700/70">Ingreso</p>
                <p className="text-xs font-semibold text-teal-900">{formatDate(consultation.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-cyan-50 px-3 py-3">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                <p className="mt-2 text-[11px] font-bold uppercase text-cyan-700/70">Resumen</p>
                <p className="text-xs font-semibold text-cyan-900">{consultation.clinicalSummary ? 'Disponible' : 'Pendiente'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-3">
                <FileCheck2 className="h-4 w-4 text-slate-500" />
                <p className="mt-2 text-[11px] font-bold uppercase text-slate-500">Espera</p>
                <p className="text-xs font-semibold text-slate-800">{minutesWaiting(consultation.createdAt)}</p>
              </div>
            </div>
          </div>

          {canClose && (
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[220px_1fr_auto] lg:items-center">
              <div>
                <label htmlFor="baseline-symptom-severity" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Severidad base
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="baseline-symptom-severity"
                    type="range"
                    min={1}
                    max={10}
                    value={baselineSymptomSeverity}
                    onChange={event => setBaselineSymptomSeverity(Number(event.target.value))}
                    className="w-full accent-teal-500"
                  />
                  <span className="min-w-10 rounded-lg bg-teal-50 px-2 py-1 text-center text-sm font-black text-teal-700">
                    {baselineSymptomSeverity}
                    /10
                  </span>
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={redFlagsConfirmed}
                  onChange={event => setRedFlagsConfirmed(event.target.checked)}
                  className="mt-0.5 accent-teal-500"
                />
                <span>
                  Confirmo que las señales de alarma del triage resultaron clínicamente relevantes al cierre.
                </span>
              </label>
              <button
                type="button"
                onClick={() => setCloseConfirmationOpen(true)}
                disabled={closeConsultationMutation.isPending}
                className="inline-flex justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                Cerrar consulta
              </button>
            </div>
          )}

          {isClosed && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
              Consulta cerrada el
              {' '}
              {formatDate(consultation.closedAt)}
              . El chat queda en modo lectura.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
          <div className="grid min-h-[680px] grid-cols-1 gap-4 lg:grid-cols-2">
            <ChatPanel
              messages={messages}
              status={socketStatus}
              onSend={sendMessage}
              onRetry={message => sendMessage(message.content, message.clientMessageId)}
              currentUserId={doctorId ?? ''}
              disabled={isClosed}
            />
            <ClinicalSummaryPanel
              consultationId={consultationId}
              summary={consultation.clinicalSummary}
              citations={consultation.clinicalSummaryCitations ?? []}
              isGenerating={generateSummaryMutation.isPending}
              onGenerate={handleGenerateSummary}
              onFeedback={(input) => {
                void toast.promise(summaryFeedbackMutation.mutateAsync(input), {
                  loading: 'Registrando feedback...',
                  success: 'Feedback clinico guardado',
                  error: error => error instanceof Error ? error.message : 'No fue posible registrar el feedback',
                })
              }}
              feedbackValue={consultation.summaryFeedback?.value ?? null}
              disabled={isClosed}
              triage={consultation.triage}
            />
          </div>
          <PatientTimelinePanel patientId={consultation.patientId} />
        </div>
      </div>

      {closeConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-2 text-red-600">
                {closeConsultationMutation.isPending
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Confirmar cierre clínico</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Se cerrará la consulta con severidad base
                  {' '}
                  <strong>
                    {baselineSymptomSeverity}
                    /10
                  </strong>
                  {' '}
                  y señales de alarma
                  {' '}
                  <strong>{redFlagsConfirmed ? 'confirmadas' : 'no confirmadas'}</strong>
                  . Esta acción notificará al paciente.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseConfirmationOpen(false)}
                disabled={closeConsultationMutation.isPending}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleClose()}
                disabled={closeConsultationMutation.isPending}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
