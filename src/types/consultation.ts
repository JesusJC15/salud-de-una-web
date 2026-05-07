import type { QueueItem } from '@/features/doctor-queue/services/consultation-service'

export interface ConsultationQueueResponseDto {
  items: QueueItem[]
}
