import type { RegisterDoctorDto } from '@/types'

const NON_DIGITS_PATTERN = /\D/g

const NUMERIC_ONLY_FIELDS = new Set<keyof RegisterDoctorDto>([
  'professionalLicense',
  'personalId',
  'phoneNumber',
])

export function sanitizeRegisterDoctorField(
  name: keyof RegisterDoctorDto,
  value: string,
): string {
  if (NUMERIC_ONLY_FIELDS.has(name)) {
    return value.replaceAll(NON_DIGITS_PATTERN, '')
  }

  return value
}
