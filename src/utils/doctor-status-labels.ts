import { DoctorStatus } from '../types/enums'
import { translateEnumValue } from './enum-labels'

export const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  [DoctorStatus.PENDING]: 'Pendiente de verificacion',
  [DoctorStatus.VERIFIED]: 'Verificado',
  [DoctorStatus.REJECTED]: 'Rechazado',
}

export function translateDoctorStatus(type: string | undefined): string {
  return translateEnumValue(DOCTOR_STATUS_LABELS, type)
}
