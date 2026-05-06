import type { ListDoctorsForReviewResponse } from '@/types/admin'
import { apiClient } from '@/api/api-client'

const TRIM_TRAILING_SLASHES = /\/+$/

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
      `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/v1').replace(TRIM_TRAILING_SLASHES, '')}/admin/reports/consultations.csv?${new URLSearchParams(
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
}
