import { apiClient } from '@/api/api-client'

export type ConsultationPriority = 'LOW' | 'MODERATE' | 'HIGH'
export type ConsultationStatus = 'PENDING' | 'IN_ATTENTION' | 'CLOSED'

export interface QueueItem {
  id: string
  patientId: string
  triageSessionId: string
  specialty: string
  priority: ConsultationPriority
  status: ConsultationStatus
  createdAt: string | null
}

export interface ConsultationDetail extends QueueItem {
  assignedDoctorId?: string
  clinicalSummary?: string
  closedAt?: string
  updatedAt?: string
  triage: {
    status: string
    answers: { questionId: string, questionText: string, answerValue: unknown }[]
    analysis?: {
      priority: ConsultationPriority
      redFlags: { code: string, severity: string, evidence: string }[]
      aiSummary?: string
    }
  } | null
}

export interface ChatMessage {
  id: string
  consultationId: string
  senderId: string
  senderRole: 'PATIENT' | 'DOCTOR'
  content: string
  type: 'TEXT'
  createdAt?: string
}

export interface HistoryItem {
  id: string
  patientId?: string
  specialty: string
  priority: ConsultationPriority
  status: ConsultationStatus
  clinicalSummary?: string
  createdAt: string | null
  closedAt?: string | null
}

export interface HistoryResponse {
  items: HistoryItem[]
  total: number
  page: number
  limit: number
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
    const res = await apiClient('').post<{ consultationId: string, summary: string, generatedAt: string }>(
      `consultations/${id}/summary/generate`,
    )
    return res.data
  },

  async close(id: string) {
    const res = await apiClient('').patch<{ id: string, status: string, closedAt: string }>(
      `consultations/${id}/close`,
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
}
