'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { decodeJwt } from 'jose'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChatPanel } from '@/features/doctor-queue/components/chat-panel'
import { ClinicalSummaryPanel } from '@/features/doctor-queue/components/clinical-summary-panel'
import { PriorityBadge } from '@/features/doctor-queue/components/priority-badge'
import { useChatSocket } from '@/features/doctor-queue/hooks/use-chat-socket'
import { useCloseConsultation } from '@/features/doctor-queue/hooks/use-close-consultation'
import { useConsultationDetail } from '@/features/doctor-queue/hooks/use-consultation-detail'
import { useGenerateSummary } from '@/features/doctor-queue/hooks/use-generate-summary'
import { authService } from '@/services/auth-service'

const NS = 'https://salud-de-una.com/'

interface Props { consultationId: string }

export function DoctorConsultationPage({ consultationId }: Props) {
  const router = useRouter()
  const { getAccessTokenSilently } = useAuth0()
  const [doctorId, setDoctorId] = useState<string | null>(null)

  const { data: consultation, isLoading } = useConsultationDetail(consultationId)
  const generateSummaryMutation = useGenerateSummary(consultationId)
  const closeConsultationMutation = useCloseConsultation(consultationId)
  const { messages, status: socketStatus, sendMessage } = useChatSocket(
    consultation?.status === 'IN_ATTENTION' ? consultationId : null,
  )

  useEffect(() => {
    async function extractDoctorId() {
      try {
        const token = await authService.getAccessToken() ?? await getAccessTokenSilently()
        if (!token)
          return
        const claims = decodeJwt(token) as Record<string, unknown>
        const dbId = claims[`${NS}db_id`] as string | undefined
        if (dbId)
          setDoctorId(dbId)
      }
      catch {}
    }
    void extractDoctorId()
  }, [getAccessTokenSilently])

  const handleClose = async () => {
    await closeConsultationMutation.mutateAsync()
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

      <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-4 lg:grid-cols-2">
        <ChatPanel
          messages={messages}
          status={socketStatus}
          onSend={sendMessage}
          currentUserId={doctorId ?? ''}
          disabled={isClosed}
        />
        <ClinicalSummaryPanel
          summary={consultation.clinicalSummary}
          isGenerating={generateSummaryMutation.isPending}
          onGenerate={() => void generateSummaryMutation.mutateAsync()}
          disabled={isClosed}
          triage={consultation.triage}
        />
      </div>
    </div>
  )
}
