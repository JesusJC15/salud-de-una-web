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
}
