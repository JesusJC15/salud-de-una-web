'use client'

import type { DoctorAvailability } from '@/features/doctor-queue/services/doctor-service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
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
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['doctor', 'me'] })
      const previous = queryClient.getQueryData<typeof query.data>(['doctor', 'me'])
      queryClient.setQueryData(['doctor', 'me'], (prev: typeof query.data) =>
        prev ? { ...prev, availabilityStatus: status } : prev)
      return { previous }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['doctor', 'me'], (prev: typeof query.data) =>
        prev ? { ...prev, availabilityStatus: data.availabilityStatus } : prev)
      toast.success(data.availabilityStatus === 'AVAILABLE' ? 'Disponibilidad reanudada' : 'Disponibilidad pausada')
    },
    onError: (error, _status, context) => {
      queryClient.setQueryData(['doctor', 'me'], context?.previous)
      toast.error(error instanceof Error ? error.message : 'No fue posible actualizar tu disponibilidad')
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
    doctorStatus: query.data?.doctorStatus ?? 'PENDING',
    isUpdating: mutation.isPending,
    toggle,
  }
}
