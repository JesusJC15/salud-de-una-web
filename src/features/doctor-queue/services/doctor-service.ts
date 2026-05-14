import { apiClient } from '@/api/api-client'

export type DoctorAvailability = 'AVAILABLE' | 'PAUSED'

export interface DoctorProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  specialty: string
  doctorStatus: string
  availabilityStatus: DoctorAvailability
}

export const doctorService = {
  async getMe(): Promise<DoctorProfile> {
    const res = await apiClient('').get<DoctorProfile>('doctors/me')
    return res.data
  },

  async updateAvailability(status: DoctorAvailability): Promise<{ availabilityStatus: DoctorAvailability }> {
    const res = await apiClient('').patch<{ availabilityStatus: DoctorAvailability }>(
      'doctors/me/availability',
      { status },
    )
    return res.data
  },

  async rethusResubmit(input: { evidenceUrl?: string, notes?: string } = {}): Promise<{ message: string }> {
    const res = await apiClient('').post<{ message: string }>('doctors/me/rethus-resubmit', input)
    return res.data
  },

  async getAdminUser(role: string, userId: string) {
    const res = await apiClient('').get<import('@/types/admin').AdminUserListItem>(`admin/users/${role}/${userId}`)
    return res.data
  },
}
