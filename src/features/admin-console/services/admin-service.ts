import type {
  AiPromptItem,
  BillingPrice,
  ListDoctorsForReviewResponse,
  ListPromptsResponse,
  ListTransactionsResponse,
  RevenueMetrics,
} from '@/types/admin'
import { apiClient } from '@/api/api-client'
import envConfig from '@/utils/config/envConfig'

export interface AdminUserListItem {
  id: string
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN'
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
  specialty?: string
  doctorStatus?: string
  personalId?: string
}

export interface AdminUsersResponse {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  items: AdminUserListItem[]
}

export const adminService = {
  async listUsers(params: { role?: string, search?: string, page?: number, limit?: number } = {}) {
    const res = await apiClient('').get<AdminUsersResponse>('admin/users', {
      params,
    })
    return res.data
  },

  async listDoctors(params: { status?: string, specialty?: string, search?: string, page?: number, limit?: number } = {}) {
    const res = await apiClient('').get<ListDoctorsForReviewResponse>('admin/doctors', {
      params,
    })
    return res.data
  },

  async verifyDoctor(doctorId: string, input: { action: 'APPROVE' | 'REJECT', notes?: string, evidenceUrl?: string }) {
    const res = await apiClient('').post(`admin/doctors/${doctorId}/rethus-verify`, input)
    return res.data
  },

  async updateUserActive(role: string, userId: string, isActive: boolean) {
    const res = await apiClient('').patch(`admin/users/${role}/${userId}/active`, {
      isActive,
    })
    return res.data
  },

  async exportConsultationsCsv(params: { from?: string, to?: string, specialty?: string, priority?: string } = {}) {
    const res = await fetch(
      `${envConfig.apiBaseUrl}/admin/reports/consultations.csv?${new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value)
            acc[key] = value
          return acc
        }, {}),
      ).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${await (await import('@/services/auth-service')).authService.getAccessToken() ?? ''}`,
        },
      },
    )

    return res.text()
  },

  async listAiPrompts(params: { page?: number, limit?: number } = {}) {
    const res = await apiClient('').get<ListPromptsResponse>('admin/ai/prompts', { params })
    return res.data
  },

  async getAiPromptVersions(key: string) {
    const res = await apiClient('').get<AiPromptItem[]>(`admin/ai/prompts/${encodeURIComponent(key)}`)
    return res.data
  },

  async createAiPromptVersion(dto: { key: string, systemInstruction: string, model?: string }) {
    const res = await apiClient('').post<AiPromptItem>('admin/ai/prompts', dto)
    return res.data
  },

  async toggleAiPromptActive(id: string, active: boolean) {
    const res = await apiClient('').patch<AiPromptItem>(`admin/ai/prompts/${id}/toggle`, { active })
    return res.data
  },

  async getBillingPrices() {
    const res = await apiClient('').get<BillingPrice[]>('billing/prices')
    return res.data
  },

  async updateBillingPrice(specialty: string, amount: number) {
    const res = await apiClient('').patch<BillingPrice>(`billing/admin/prices/${specialty}`, { amount })
    return res.data
  },

  async getAdminTransactions(params: {
    from?: string
    to?: string
    specialty?: string
    status?: string
    page?: number
    limit?: number
  } = {}) {
    const res = await apiClient('').get<ListTransactionsResponse>('billing/admin/transactions', { params })
    return res.data
  },

  async getRevenueMetrics() {
    const res = await apiClient('').get<RevenueMetrics>('billing/admin/revenue')
    return res.data
  },
}
