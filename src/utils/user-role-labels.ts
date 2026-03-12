import { UserRole } from '../types/enums'
import { translateEnumValue } from './enum-labels'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Paciente',
  [UserRole.DOCTOR]: 'Doctor',
  [UserRole.ADMIN]: 'Administrador',
}

export function translateUserRole(type: string | undefined): string {
  return translateEnumValue(USER_ROLE_LABELS, type)
}
