'use client'

import type { DoctorAvailability } from '@/features/doctor-queue/services/doctor-service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doctorService } from '@/features/doctor-queue/services/doctor-service'

export function useDoctorAvailability() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['doctor', 'me'],
    queryFn: () => doctorService.getMe(),
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: (status: DoctorAvailability) => doctorService.updateAvailability(status),
    onSuccess: (data) => {
      queryClient.setQueryData(['doctor', 'me'], (prev: typeof query.data) =>
        prev ? { ...prev, availabilityStatus: data.availabilityStatus } : prev)
    },
  })

  const toggle = () => {
    const current = query.data?.availabilityStatus ?? 'AVAILABLE'
    mutation.mutate(current === 'AVAILABLE' ? 'PAUSED' : 'AVAILABLE')
  }

  return {
    availability: query.data?.availabilityStatus ?? 'AVAILABLE',
    doctorName: query.data?.firstName ?? '',
    specialty: query.data?.specialty ?? '',
    isUpdating: mutation.isPending,
    toggle,
  }
}
