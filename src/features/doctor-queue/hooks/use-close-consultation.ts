'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useCloseConsultation(consultationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { baselineSymptomSeverity: number, redFlagsConfirmed: boolean }) =>
      consultationService.close(consultationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          'doctor',
          'consultation',
          consultationId,
        ],
      })
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'consultation-queue'] })
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'history'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'business-metrics'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'consultation-metrics'] })
    },
  })
}
