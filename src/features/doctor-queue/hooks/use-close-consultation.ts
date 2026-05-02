'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useCloseConsultation(consultationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => consultationService.close(consultationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [
          'doctor',
          'consultation',
          consultationId,
        ],
      })
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'consultation-queue'] })
    },
  })
}
