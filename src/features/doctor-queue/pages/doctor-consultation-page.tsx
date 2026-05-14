'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
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

export function DoctorConsultationPage({ consultationId }: Props) {
  const router = useRouter()
  const session = useSession()
  const doctorId = session?.id ?? null

  const [baselineSymptomSeverity, setBaselineSymptomSeverity] = useState(5)
  const [redFlagsConfirmed, setRedFlagsConfirmed] = useState(false)
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false)

  const { data: consultation, isLoading } = useConsultationDetail(consultationId)
  const generateSummaryMutation = useGenerateSummary(consultationId)
  const closeConsultationMutation = useCloseConsultation(consultationId)
  const summaryFeedbackMutation = useSummaryFeedback(consultationId)
  const { messages, status: socketStatus, sendMessage } = useChatSocket(
    consultation?.status === 'IN_ATTENTION' ? consultationId : null,
    doctorId,
  )

  const handleClose = async () => {
    try {
      await closeConsultationMutation.mutateAsync({
        baselineSymptomSeverity,
        redFlagsConfirmed,
      })
      toast.success('Consulta cerrada')
      router.push('/doctor/queue')
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible cerrar la consulta')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Consulta no encontrada</p>
      </div>
    )
  }

  const isClosed = consultation.status === 'CLOSED'

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/doctor/queue')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Cola
          </button>
          <PriorityBadge priority={consultation.priority} />
          <span className="text-sm font-medium text-slate-500">{translateSpecialty(consultation.specialty)}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {translateConsultationStatus(consultation.status)}
          </span>
        </div>
        {!isClosed && consultation.status === 'IN_ATTENTION' && (
          <button
            type="button"
            onClick={() => setCloseConfirmationOpen(true)}
            disabled={closeConsultationMutation.isPending}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            Cerrar consulta
          </button>
        )}
      </div>

      {!isClosed && consultation.status === 'IN_ATTENTION' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div>
              <label htmlFor="baseline-symptom-severity" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Severidad base
              </label>
              <input
                id="baseline-symptom-severity"
                type="range"
                min={1}
                max={10}
                value={baselineSymptomSeverity}
                onChange={event => setBaselineSymptomSeverity(Number(event.target.value))}
                className="mt-2 w-full accent-teal-500"
              />
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {baselineSymptomSeverity}
                /10
              </p>
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={redFlagsConfirmed}
                onChange={event => setRedFlagsConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              Confirmo que las señales de alarma del triage resultaron clínicamente relevantes al cierre.
            </label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-4 lg:grid-cols-2">
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
            onGenerate={() => {
              void generateSummaryMutation.mutateAsync().catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : 'No fue posible generar el resumen')
              })
            }}
            onFeedback={(input) => {
              void summaryFeedbackMutation.mutateAsync(input).catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : 'No fue posible registrar el feedback')
              })
            }}
            feedbackValue={consultation.summaryFeedback?.value ?? null}
            disabled={isClosed}
            triage={consultation.triage}
          />
        </div>
        <div>
          <PatientTimelinePanel patientId={consultation.patientId} />
        </div>
      </div>

      {closeConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Confirmar cierre clínico</h2>
            <p className="mt-2 text-sm text-slate-600">
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
              .
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseConfirmationOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleClose()}
                disabled={closeConsultationMutation.isPending}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
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
