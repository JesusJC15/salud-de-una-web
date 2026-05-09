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
  productKpis: {
    key: string
    label: string
    value: number
    target: number
    unit: string
    formula: string
    source: string
    state: 'OK' | 'WARNING' | 'CRITICAL'
  }[]
}

interface TechnicalMetrics {
  sampleSize: number
  p95LatencyMs: number
  errorRate: number
  timestamp: string
  source: 'redis' | 'memory'
  degraded: boolean
}

export interface DashboardAlerts {
  generatedAt: string
  items: {
    key: string
    level: 'OK' | 'WARNING' | 'CRITICAL'
    message: string
  }[]
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

export function useDashboardAlerts() {
  return useQuery<DashboardAlerts>({
    queryKey: ['admin', 'dashboard-alerts'],
    queryFn: async () => {
      const res = await apiClient('').get<DashboardAlerts>('dashboard/alerts')
      return res.data
    },
    retry: 2,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

export interface ReadinessStatus {
  status: string
  mongodb?: string
  redis?: string
  ai?: string
  [key: string]: string | undefined
}

export function useSystemHealth() {
  return useQuery<ReadinessStatus>({
    queryKey: ['admin', 'system-health'],
    queryFn: async () => {
      const res = await apiClient('').get<ReadinessStatus>('ready')
      return res.data
    },
    retry: 1,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export interface ErrorLogEntry {
  id: string
  timestamp: string
  statusCode: number
  method: string
  url: string
  correlationId?: string
  userId?: string
  errorMessage: string
}

export function useRecentErrors() {
  return useQuery<ErrorLogEntry[]>({
    queryKey: ['admin', 'recent-errors'],
    queryFn: async () => {
      const res = await apiClient('').get<ErrorLogEntry[]>('dashboard/errors', { params: { limit: 10 } })
      return res.data
    },
    retry: 1,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export interface AiUsageMetrics {
  windowHours: number
  total: number
  successCount: number
  errorCount: number
  successRate: number
  avgLatencyMs: number
  byPromptKey: Record<string, number>
}

export function useRevenueMetrics() {
  return useQuery({
    queryKey: ['admin', 'revenue-metrics'],
    queryFn: async () => {
      const { adminService } = await import('@/features/admin-console/services/admin-service')
      return adminService.getRevenueMetrics()
    },
    retry: 1,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}

export function useAiMetrics() {
  return useQuery<AiUsageMetrics>({
    queryKey: ['admin', 'ai-metrics'],
    queryFn: async () => {
      const res = await apiClient('').get<AiUsageMetrics>('dashboard/ai-metrics')
      return res.data
    },
    retry: 1,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}
