'use client'

import { useQuery } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useConsultationDetail(id: string | null) {
  return useQuery({
    queryKey: [
      'doctor',
      'consultation',
      id,
    ],
    queryFn: () => consultationService.getById(id!),
    enabled: !!id,
    staleTime: 10_000,
  })
}
