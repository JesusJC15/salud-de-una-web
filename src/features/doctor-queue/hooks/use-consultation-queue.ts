'use client'

import { useQuery } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useConsultationQueue() {
  return useQuery({
    queryKey: ['doctor', 'consultation-queue'],
    queryFn: () => consultationService.getQueue(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}
