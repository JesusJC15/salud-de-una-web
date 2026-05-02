'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useGenerateSummary(consultationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => consultationService.generateSummary(consultationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          'doctor',
          'consultation',
          consultationId,
        ],
      })
    },
  })
}
