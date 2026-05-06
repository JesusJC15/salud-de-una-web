'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'

export function usePatientTimeline(patientId: string | null) {
  return useInfiniteQuery({
    queryKey: [
      'patient',
      'timeline',
      patientId,
    ],
    queryFn: ({ pageParam }) =>
      consultationService.getPatientTimeline(patientId!, {
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    enabled: !!patientId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })
}
