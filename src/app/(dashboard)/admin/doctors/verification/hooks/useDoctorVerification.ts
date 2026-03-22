import type {
  DoctorReviewItem,
  ListDoctorsForReviewResponse,
  RethusVerifyDecisionDto,
  VerifyDoctorResponseDto,
} from '@/types'
import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/api/api-client'

interface UseDoctorVerificationOptions {
  enabled?: boolean
}

const adminClient = apiClient('/admin')

function normalizeDoctors(data: ListDoctorsForReviewResponse | DoctorReviewItem[]) {
  if (Array.isArray(data)) {
    return data
  }

  return data.items
}

export function useDoctorVerification(options?: UseDoctorVerificationOptions) {
  const enabled = options?.enabled ?? true
  const [doctors, setDoctors] = useState<DoctorReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPendingDoctors = useCallback(async () => {
    if (!enabled) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await adminClient.get<ListDoctorsForReviewResponse | DoctorReviewItem[]>(
        'doctors/review',
        {
          params: {
            status: 'PENDING',
            page: 1,
            limit: 100,
          },
        },
      )

      const pendingDoctors = normalizeDoctors(response.data)
        .filter(doctor => doctor.doctorStatus === 'PENDING')

      setDoctors(pendingDoctors)
    }
    catch (fetchError) {
      const message = fetchError instanceof Error
        ? fetchError.message
        : 'No fue posible cargar los medicos pendientes.'
      setError(message)
      setDoctors([])
    }
    finally {
      setIsLoading(false)
    }
  }, [enabled])

  const verifyDoctor = useCallback(async (doctorId: string, payload: RethusVerifyDecisionDto) => {
    const previousDoctors = doctors
    setDoctors(current => current.filter(doctor => doctor.id !== doctorId))

    try {
      const requestPayload: Record<string, unknown> = {
        action: payload.action,
        notes: payload.notes,
        ...(payload.evidenceUrl ? { evidenceUrl: payload.evidenceUrl } : {}),
      }

      await adminClient.post<VerifyDoctorResponseDto>(
        `doctors/${doctorId}/rethus-verify`,
        requestPayload,
      )
    }
    catch (submitError) {
      setDoctors(previousDoctors)
      throw submitError
    }
  }, [doctors])

  useEffect(() => {
    fetchPendingDoctors()
  }, [fetchPendingDoctors])

  return {
    doctors,
    error,
    fetchPendingDoctors,
    isLoading,
    verifyDoctor,
  }
}
