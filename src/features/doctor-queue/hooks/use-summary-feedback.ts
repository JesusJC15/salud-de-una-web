'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useSummaryFeedback(consultationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      value: 'USEFUL' | 'PARTIALLY_USEFUL' | 'NOT_USEFUL'
      comment?: string
    }) => consultationService.submitSummaryFeedback(consultationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          'doctor',
          'consultation',
          consultationId,
        ],
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'business-metrics'] })
    },
  })
}
