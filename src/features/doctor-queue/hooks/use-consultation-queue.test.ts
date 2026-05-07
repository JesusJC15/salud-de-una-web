/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import * as React from 'react'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'
import { useConsultationQueue } from './use-consultation-queue'

jest.mock('@/features/doctor-queue/services/consultation-service')

const mockGetQueue = consultationService.getQueue as jest.MockedFunction<typeof consultationService.getQueue>

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useConsultationQueue', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns queue items on successful fetch', async () => {
    const items = [{ id: '1', patientId: 'p1', triageSessionId: 't1', specialty: 'GENERAL_MEDICINE', priority: 'HIGH' as const, status: 'PENDING' as const, createdAt: null }]
    mockGetQueue.mockResolvedValue({ items })

    const { result } = renderHook(() => useConsultationQueue(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.items).toEqual(items)
    expect(mockGetQueue).toHaveBeenCalledTimes(1)
  })

  it('sets isError when fetch fails', async () => {
    mockGetQueue.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useConsultationQueue(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
