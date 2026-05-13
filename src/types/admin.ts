import type { EntityId, IsoDateString } from './common'
import type {
  DoctorStatus,
  ProgramType,
  RethusState,
  Specialty,
  TitleObtainingOrigin,
  UserRole,
} from './enums'

export interface Admin {
  id?: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}

export interface ListDoctorsForReviewDto {
  status?: DoctorStatus
  specialty?: Specialty
  search?: string
  page?: number
  limit?: number
}

export interface RethusVerifyDto {
  programType: ProgramType
  titleObtainingOrigin: TitleObtainingOrigin
  professionOccupation: string
  startDate: IsoDateString
  rethusState: RethusState
  administrativeAct: string
  reportingEntity: string
  evidenceUrl?: string
  notes?: string
}

export interface DoctorsForReviewSummary {
  total: number
  pending: number
  verified: number
  rejected: number
}

export interface DoctorsForReviewPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DoctorReviewLatestVerification {
  checkedAt: IsoDateString
  checkedBy: string
  rethusState: RethusState
  reportingEntity: string
  notes?: string
}

export interface DoctorReviewItem {
  id: EntityId
  firstName: string
  lastName: string
  email: string
  specialty: Specialty
  doctorStatus: DoctorStatus
  professionalLicense?: string
  personalId: string
  phoneNumber: string
  createdAt: IsoDateString | null
  updatedAt: IsoDateString | null
  latestVerification: DoctorReviewLatestVerification | null
}

export interface ListDoctorsForReviewResponse {
  summary: DoctorsForReviewSummary
  pagination: DoctorsForReviewPagination
  items: DoctorReviewItem[]
}

export interface VerifyDoctorResponseDto {
  doctorId: EntityId
  doctorStatus: DoctorStatus
  checkedAt: IsoDateString
  verification: {
    programType: ProgramType
    titleObtainingOrigin: TitleObtainingOrigin
    professionOccupation: string
    startDate: IsoDateString
    rethusState: RethusState
    administrativeAct: string
    reportingEntity: string
    checkedBy: string
    evidenceUrl?: string
    notes?: string
  }
}

export interface AiPromptItem {
  _id: string
  key: string
  version: number
  provider: string
  model: string
  active: boolean
  systemInstruction: string
  metadata?: Record<string, unknown>
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}

export interface ListPromptsResponse {
  items: AiPromptItem[]
  total: number
  page: number
  limit: number
}

export interface BillingPrice {
  _id?: string
  specialty: string
  amount: number
  currency: string
  active: boolean
  updatedAt?: IsoDateString | null
}

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED'

export interface BillingTransaction {
  id: string
  patientId: string
  consultationId: string
  specialty: string
  amount: number
  currency: string
  status: TransactionStatus
  paidAt?: IsoDateString | null
  createdAt?: IsoDateString | null
}

export interface ListTransactionsResponse {
  items: BillingTransaction[]
  total: number
  page: number
  limit: number
}

export interface RevenueMetrics {
  currentMonth: {
    totalRevenue: number
    paidConsultations: number
    currency: string
  }
  bySpecialty: Array<{
    specialty: string
    totalRevenue: number
    count: number
  }>
}

export interface KnowledgeSourceItem {
  _id?: string
  name: string
  authority: string
  sourceType: string
  status: 'ACTIVE' | 'SUSPENDED'
  baseUrl?: string
  country: string
  allowUrlIngest: boolean
  authorityWeight: number
  isGlobalFallback: boolean
  notes?: string
}

export interface KnowledgeDocumentItem {
  id: string
  sourceId: string | null
  title: string
  authority: string
  sourceType: string
  status: string
  country: string
  specialty: string
  audience: string
  useCases: string[]
  language: string
  originalFileName: string | null
  mimeType: string | null
  sourceUrl: string | null
  currentVersion: number
  reviewedAt: string | null
  approvedBy: string | null
  ingestionError: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface KnowledgeDocumentsResponse {
  items: KnowledgeDocumentItem[]
  total: number
}

export interface KnowledgeChunkItem {
  id: string
  chunkIndex: number
  sectionPath: string
  text: string
  reviewStatus: string
  embeddingDimensions: number
  updatedAt: string | null
}

export interface KnowledgeChunksResponse {
  items: KnowledgeChunkItem[]
  total: number
}

export interface KnowledgeJobItem {
  id: string
  type: string
  status: string
  documentId: string | null
  sourceId: string | null
  durationMs: number
  errorMessage: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface KnowledgeJobsResponse {
  items: KnowledgeJobItem[]
  total: number
}

export interface RagMetrics {
  generatedAt: string
  corpus: {
    totalDocuments: number
    approvedDocuments: number
    pendingReview: number
    suspendedDocuments: number
  }
  jobs: {
    totalLast24h: number
    failedLast24h: number
  }
  retrieval: {
    totalLast24h: number
    groundedRate: number
    fallbackRate: number
    zeroHitRate: number
    avgLatencyMs: number
  }
  feedback: {
    total: number
    usefulRate: number
    groundedRate: number
  }
}

export interface RagTraceItem {
  id: string
  correlationId: string | null
  useCase: string
  normalizedQuery: string
  selectedChunks: Array<{
    chunkId: string
    documentId: string
    title: string
    sectionPath?: string
    score: number
    authority: string
    snippet: string
  }>
  cacheHit: boolean
  grounded: boolean
  fallback: boolean
  retrievalLatencyMs: number
  generationLatencyMs: number
  totalLatencyMs: number
  actorId: string | null
  actorRole: string | null
  answer: string | null
  createdAt: string | null
}

export interface RagTracesResponse {
  items: RagTraceItem[]
  total: number
}
