export const CONSULTATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_ATTENTION: 'En atención',
  CLOSED: 'Cerrada',
}

export function translateConsultationStatus(status: string): string {
  return CONSULTATION_STATUS_LABELS[status] ?? status
}
