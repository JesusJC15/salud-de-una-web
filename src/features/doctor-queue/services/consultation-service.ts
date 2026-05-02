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

export const consultationService = {
  async getQueue() {
    const res = await apiClient('v1').get<{ items: QueueItem[] }>('consultations/queue')
    return res.data
  },

  async getById(id: string) {
    const res = await apiClient('v1').get<ConsultationDetail>(`consultations/${id}`)
    return res.data
  },

  async assign(id: string) {
    const res = await apiClient('v1').patch<{ id: string, status: string, assignedDoctorId: string, updatedAt: string }>(
      `consultations/${id}/assign`,
    )
    return res.data
  },

  async generateSummary(id: string) {
    const res = await apiClient('v1').post<{ consultationId: string, summary: string, generatedAt: string }>(
      `consultations/${id}/summary/generate`,
    )
    return res.data
  },

  async close(id: string) {
    const res = await apiClient('v1').patch<{ id: string, status: string, closedAt: string }>(
      `consultations/${id}/close`,
    )
    return res.data
  },

  async getMessages(id: string, limit = 50) {
    const res = await apiClient('v1').get<{ items: ChatMessage[], total: number }>(
      `consultations/${id}/messages`,
      { params: { limit } },
    )
    return res.data
  },
}
