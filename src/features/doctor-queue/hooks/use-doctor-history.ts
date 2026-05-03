'use client'

import { useQuery } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useDoctorHistory(page = 1, status?: string) {
  return useQuery({
    queryKey: [
      'doctor',
      'history',
      page,
      status,
    ],
    queryFn: () => consultationService.getMyHistory({ page, limit: 20, status }),
    staleTime: 30_000,
  })
}
