/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import * as React from 'react'
import { useBusinessMetrics, useConsultationMetrics, useTechnicalMetrics } from './use-dashboard-metrics'

const mockGet = jest.fn()

jest.mock('@/api/api-client', () => ({
  apiClient: () => ({ get: mockGet }),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useBusinessMetrics', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls dashboard/business endpoint', async () => {
    const bizData = {
      generatedAt: new Date().toISOString(),
      kpis: { totalPatients: 10, totalDoctors: 2, verifiedDoctors: 1, pendingDoctors: 1 },
      doctorStatusBreakdown: { verified: 1, pending: 1, rejected: 0 },
      growthLast7Days: { patients: 3, doctors: 0 },
      operationalSignals: { unreadNotifications: 0, verificationCoverage: 50 },
      productKpis: [],
    }
    mockGet.mockResolvedValue({ data: bizData })

    const { result } = renderHook(() => useBusinessMetrics(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('dashboard/business')
    expect(result.current.data?.kpis.totalPatients).toBe(10)
  })
})

describe('useTechnicalMetrics', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls dashboard/technical endpoint', async () => {
    const techData = { sampleSize: 100, p95LatencyMs: 120, errorRate: 0.01, timestamp: new Date().toISOString(), source: 'redis' as const, degraded: false }
    mockGet.mockResolvedValue({ data: techData })

    const { result } = renderHook(() => useTechnicalMetrics(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('dashboard/technical')
    expect(result.current.data?.degraded).toBe(false)
  })
})

describe('useConsultationMetrics', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls dashboard/consultations endpoint', async () => {
    const consultData = {
      generatedAt: new Date().toISOString(),
      statusBreakdown: { pending: 2, inAttention: 1, closed: 5 },
      totalConsultations: 8,
      closedLast7Days: 3,
      avgAttentionTimeMinutes: 45,
      slaCompliance: 85,
      bySpecialty: [],
      topDoctors: [],
    }
    mockGet.mockResolvedValue({ data: consultData })

    const { result } = renderHook(() => useConsultationMetrics(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('dashboard/consultations')
    expect(result.current.data?.totalConsultations).toBe(8)
  })
})
