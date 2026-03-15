import type { BusinessMetricsResponseDto, TechnicalMetricsResponseDto } from '@/types'
import { apiClient } from '@/api/api-client'

const dashboardClient = apiClient('/dashboard')

export async function getBusinessMetrics() {
  const response = await dashboardClient.get<BusinessMetricsResponseDto>('business')
  return response.data
}

export async function getTechnicalMetrics() {
  const response = await dashboardClient.get<TechnicalMetricsResponseDto>('technical')
  return response.data
}
