'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/api-client'

interface BusinessMetrics {
  generatedAt: string
  kpis: {
    totalPatients: number
    totalDoctors: number
    verifiedDoctors: number
    pendingDoctors: number
  }
  doctorStatusBreakdown: {
    verified: number
    pending: number
    rejected: number
  }
  growthLast7Days: {
    patients: number
    doctors: number
  }
  operationalSignals: {
    unreadNotifications: number
    verificationCoverage: number
  }
}

interface TechnicalMetrics {
  sampleSize: number
  p95LatencyMs: number
  errorRate: number
  timestamp: string
  source: 'redis' | 'memory'
  degraded: boolean
}

export function useBusinessMetrics() {
  return useQuery<BusinessMetrics>({
    queryKey: ['admin', 'business-metrics'],
    queryFn: async () => {
      const res = await apiClient('v1').get<BusinessMetrics>('dashboard/business')
      return res.data
    },
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}

export function useTechnicalMetrics() {
  return useQuery<TechnicalMetrics>({
    queryKey: ['admin', 'technical-metrics'],
    queryFn: async () => {
      const res = await apiClient('v1').get<TechnicalMetrics>('dashboard/technical')
      return res.data
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}
