'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChatPanel } from '@/features/doctor-queue/components/chat-panel'
import { ClinicalSummaryPanel } from '@/features/doctor-queue/components/clinical-summary-panel'
import { PatientTimelinePanel } from '@/features/doctor-queue/components/patient-timeline-panel'
import { PriorityBadge } from '@/features/doctor-queue/components/priority-badge'
import { useChatSocket } from '@/features/doctor-queue/hooks/use-chat-socket'
import { useCloseConsultation } from '@/features/doctor-queue/hooks/use-close-consultation'
import { useConsultationDetail } from '@/features/doctor-queue/hooks/use-consultation-detail'
import { useGenerateSummary } from '@/features/doctor-queue/hooks/use-generate-summary'
import { useSummaryFeedback } from '@/features/doctor-queue/hooks/use-summary-feedback'
import { authService } from '@/services/auth-service'

interface Props { consultationId: string }

export function DoctorConsultationPage({ consultationId }: Props) {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [baselineSymptomSeverity, setBaselineSymptomSeverity] = useState(5)
  const [redFlagsConfirmed, setRedFlagsConfirmed] = useState(false)

  const { data: consultation, isLoading } = useConsultationDetail(consultationId)
  const generateSummaryMutation = useGenerateSummary(consultationId)
  const closeConsultationMutation = useCloseConsultation(consultationId)
  const summaryFeedbackMutation = useSummaryFeedback(consultationId)
  const { messages, status: socketStatus, sendMessage } = useChatSocket(
    consultation?.status === 'IN_ATTENTION' ? consultationId : null,
  )

  useEffect(() => {
    async function extractDoctorId() {
      try {
        const user = await authService.getCurrentUser()
        if (!user)
          return
        setDoctorId(user.id)
      }
      catch {}
    }
    void extractDoctorId()
  }, [])

  const handleClose = async () => {
    await closeConsultationMutation.mutateAsync({
      baselineSymptomSeverity,
      redFlagsConfirmed,
    })
    router.push('/doctor/queue')
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
            onClick={() => router.push('/doctor/queue')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Cola
          </button>
          <PriorityBadge priority={consultation.priority} />
          <span className="text-sm text-slate-500 font-medium">{consultation.specialty}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {consultation.status}
          </span>
        </div>
        {!isClosed && consultation.status === 'IN_ATTENTION' && (
          <button
            onClick={() => void handleClose()}
            disabled={closeConsultationMutation.isPending}
            className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
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
            currentUserId={doctorId ?? ''}
            disabled={isClosed}
          />
          <ClinicalSummaryPanel
            consultationId={consultationId}
            summary={consultation.clinicalSummary}
            citations={consultation.clinicalSummaryCitations ?? []}
            isGenerating={generateSummaryMutation.isPending}
            onGenerate={() => void generateSummaryMutation.mutateAsync()}
            onFeedback={input => void summaryFeedbackMutation.mutateAsync(input)}
            feedbackValue={consultation.summaryFeedback?.value ?? null}
            disabled={isClosed}
            triage={consultation.triage}
          />
        </div>
        <div>
          <PatientTimelinePanel patientId={consultation.patientId} />
        </div>
      </div>
    </div>
  )
}
