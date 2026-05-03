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
      const res = await apiClient('').get<BusinessMetrics>('dashboard/business')
      return res.data
    },
    retry: 2,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}

export interface ConsultationMetrics {
  generatedAt: string
  statusBreakdown: { pending: number, inAttention: number, closed: number }
  totalConsultations: number
  closedLast7Days: number
  avgAttentionTimeMinutes: number | null
  slaCompliance: number | null
  bySpecialty: { specialty: string, total: number, closed: number }[]
  topDoctors: { doctorId: string, name: string, specialty?: string, closed: number }[]
}

export function useConsultationMetrics() {
  return useQuery<ConsultationMetrics>({
    queryKey: ['admin', 'consultation-metrics'],
    queryFn: async () => {
      const res = await apiClient('').get<ConsultationMetrics>('dashboard/consultations')
      return res.data
    },
    retry: 2,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}

export function useTechnicalMetrics() {
  return useQuery<TechnicalMetrics>({
    queryKey: ['admin', 'technical-metrics'],
    queryFn: async () => {
      const res = await apiClient('').get<TechnicalMetrics>('dashboard/technical')
      return res.data
    },
    retry: 2,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}
