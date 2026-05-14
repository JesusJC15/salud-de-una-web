import type { IsoDateString } from './common'

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

export interface ClinicalCitation {
  chunkId: string
  documentId: string
  title: string
  sectionPath: string | null
  authority: string
  snippet: string | null
  score: number
}

export interface ConsultationDetail extends QueueItem {
  assignedDoctorId?: string
  clinicalSummary?: string
  clinicalSummaryTraceId?: string | null
  clinicalSummaryCitations?: ClinicalCitation[]
  closedAt?: string
  updatedAt?: string
  summaryFeedback?: {
    value: 'USEFUL' | 'PARTIALLY_USEFUL' | 'NOT_USEFUL'
    comment: string | null
    createdAt: string
  } | null
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
  clientMessageId?: string
  id: string
  consultationId: string
  deliveryStatus?: 'sending' | 'sent' | 'failed'
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

export interface TimelineEvent {
  id: string
  type:
    | 'TRIAGE_COMPLETED'
    | 'CONSULTATION_ASSIGNED'
    | 'CONSULTATION_CLOSED'
    | 'FOLLOWUP_CREATED'
    | 'FOLLOWUP_DUE'
    | 'FOLLOWUP_COMPLETED'
    | 'PRIORITY_ESCALATED'
  occurredAt: IsoDateString
  title: string
  subtitle: string
  resourceId?: string
}

export interface TimelineResponse {
  items: TimelineEvent[]
  nextCursor: string | null
}

export interface ConsultationQueueResponseDto {
  items: QueueItem[]
}
