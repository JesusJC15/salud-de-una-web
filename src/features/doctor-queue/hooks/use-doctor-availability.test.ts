/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import * as React from 'react'
import { doctorService } from '@/features/doctor-queue/services/doctor-service'
import { useDoctorAvailability } from './use-doctor-availability'

async function waitForCondition(assertion: () => void, timeoutMs = 1000) {
  const startedAt = Date.now()

  while (true) {
    try {
      assertion()
      return
    }
    catch (error) {
      if (Date.now() - startedAt >= timeoutMs) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
}

jest.mock('@/features/doctor-queue/services/doctor-service')

const mockGetMe = doctorService.getMe as jest.MockedFunction<typeof doctorService.getMe>
const mockUpdateAvailability = doctorService.updateAvailability as jest.MockedFunction<typeof doctorService.updateAvailability>

const DOCTOR_FIXTURE = {
  id: 'd1',
  firstName: 'Ana',
  lastName: 'Gómez',
  email: 'ana@example.com',
  specialty: 'GENERAL_MEDICINE',
  doctorStatus: 'VERIFIED',
  availabilityStatus: 'AVAILABLE' as const,
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDoctorAvailability', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns AVAILABLE as default when doctor is available', async () => {
    mockGetMe.mockResolvedValue(DOCTOR_FIXTURE)

    const { result } = renderHook(() => useDoctorAvailability(), { wrapper: makeWrapper() })

    await waitForCondition(() => expect(result.current.availability).toBe('AVAILABLE'))
  })

  it('calls updateAvailability with PAUSED when toggling from AVAILABLE', async () => {
    mockGetMe.mockResolvedValue(DOCTOR_FIXTURE)
    mockUpdateAvailability.mockResolvedValue({ availabilityStatus: 'PAUSED' })

    const { result } = renderHook(() => useDoctorAvailability(), { wrapper: makeWrapper() })

    await waitForCondition(() => expect(result.current.availability).toBe('AVAILABLE'))

    result.current.toggle()

    await waitForCondition(() => expect(mockUpdateAvailability).toHaveBeenCalledWith('PAUSED'))
  })
})
