import type {
  ChatMessage,
  ConsultationDetail,
  ConsultationPriority,
  ConsultationStatus,
  HistoryItem,
  HistoryResponse,
  QueueItem,
  TimelineEvent,
  TimelineResponse,
} from '@/types/consultation'
import { apiClient } from '@/api/api-client'

// Re-export types so existing imports from this file continue to work
export type {
  ChatMessage,
  ConsultationDetail,
  ConsultationPriority,
  ConsultationStatus,
  HistoryItem,
  HistoryResponse,
  QueueItem,
  TimelineEvent,
  TimelineResponse,
}

export const consultationService = {
  async getQueue() {
    const res = await apiClient('').get<{ items: QueueItem[] }>('consultations/queue')
    return res.data
  },

  async getById(id: string) {
    const res = await apiClient('').get<ConsultationDetail>(`consultations/${id}`)
    return res.data
  },

  async assign(id: string) {
    const res = await apiClient('').patch<{ id: string, status: string, assignedDoctorId: string, updatedAt: string }>(
      `consultations/${id}/assign`,
    )
    return res.data
  },

  async generateSummary(id: string) {
    const res = await apiClient('').post<{
      consultationId: string
      summary: string
      generatedAt: string
      traceId: string | null
      citations: Array<{
        chunkId: string
        documentId: string
        title: string
        sectionPath: string | null
        authority: string
        snippet: string | null
        score: number
      }>
    }>(
      `consultations/${id}/summary/generate`,
    )
    return res.data
  },

  async close(
    id: string,
    input: { baselineSymptomSeverity: number, redFlagsConfirmed: boolean } = {
      baselineSymptomSeverity: 5,
      redFlagsConfirmed: false,
    },
  ) {
    const res = await apiClient('').patch<{ id: string, status: string, closedAt: string }>(
      `consultations/${id}/close`,
      input,
    )
    return res.data
  },

  async getMessages(id: string, limit = 50) {
    const res = await apiClient('').get<{ items: ChatMessage[], total: number }>(
      `consultations/${id}/messages`,
      { params: { limit } },
    )
    return res.data
  },

  async getMyHistory(options: { page?: number, limit?: number, status?: string } = {}) {
    const res = await apiClient('').get<HistoryResponse>('consultations/doctor/my-history', {
      params: { page: options.page ?? 1, limit: options.limit ?? 20, status: options.status },
    })
    return res.data
  },

  async submitSummaryFeedback(
    id: string,
    input: {
      value: 'USEFUL' | 'PARTIALLY_USEFUL' | 'NOT_USEFUL'
      comment?: string
    },
  ) {
    const res = await apiClient('').patch<{ id: string }>(
      `consultations/${id}/summary/feedback`,
      input,
    )
    return res.data
  },

  async getPatientTimeline(patientId: string, options: { cursor?: string, limit?: number } = {}) {
    const res = await apiClient('').get<TimelineResponse>(`patients/${patientId}/timeline`, {
      params: { cursor: options.cursor, limit: options.limit ?? 20 },
    })
    return res.data
  },
}
