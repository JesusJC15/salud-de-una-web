/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import * as React from 'react'
import { consultationService } from '@/features/doctor-queue/services/consultation-service'
import { useAssignConsultation } from './use-assign-consultation'

jest.mock('@/features/doctor-queue/services/consultation-service')

const mockAssign = consultationService.assign as jest.MockedFunction<typeof consultationService.assign>

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAssignConsultation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls consultationService.assign with the consultation id', async () => {
    mockAssign.mockResolvedValue({ id: 'c1', status: 'IN_ATTENTION', assignedDoctorId: 'd1', updatedAt: new Date().toISOString() })

    const { result } = renderHook(() => useAssignConsultation(), { wrapper: makeWrapper() })

    result.current.mutate('c1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockAssign).toHaveBeenCalledWith('c1')
  })

  it('sets isError when assign fails', async () => {
    mockAssign.mockRejectedValue(new Error('Forbidden'))

    const { result } = renderHook(() => useAssignConsultation(), { wrapper: makeWrapper() })

    result.current.mutate('c1')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
