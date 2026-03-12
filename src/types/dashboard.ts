import type { IsoDateString } from './common'

export interface TechnicalMetricsResponseDto {
  sampleSize: number
  p95LatencyMs: number
  errorRate: number
  timestamp: IsoDateString
}

export interface BusinessMetricsResponseDto {
  generatedAt: IsoDateString
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
