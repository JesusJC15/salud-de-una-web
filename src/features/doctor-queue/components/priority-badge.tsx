import type { ConsultationPriority } from '@/features/doctor-queue/services/consultation-service'

const CONFIG: Record<ConsultationPriority, { label: string, className: string }> = {
  HIGH: { label: 'Alta', className: 'bg-red-100 text-red-700 border-red-200' },
  MODERATE: { label: 'Moderada', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  LOW: { label: 'Baja', className: 'bg-green-100 text-green-700 border-green-200' },
}

export function PriorityBadge({ priority }: { priority: ConsultationPriority }) {
  const { label, className } = CONFIG[priority]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${className}`}>
      {label}
    </span>
  )
}
