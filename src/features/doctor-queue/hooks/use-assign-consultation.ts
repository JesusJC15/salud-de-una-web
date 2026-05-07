'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function useAssignConsultation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => consultationService.assign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'consultation-queue'] })
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'history'] })
    },
  })
}
