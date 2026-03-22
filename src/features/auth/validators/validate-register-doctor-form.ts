import type { RegisterDoctorDto } from '@/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const DIGITS_ONLY_PATTERN = /^\d+$/

export interface RegisterFormClientGuardsInput {
  confirmPassword: string
  acceptedTerms: boolean
}

export function validateRegisterDoctorForm(
  formData: RegisterDoctorDto,
  clientGuards?: RegisterFormClientGuardsInput,
): string | null {
  if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
    return 'Completa los campos obligatorios'
  }

  if (!EMAIL_PATTERN.test(formData.email)) {
    return 'Ingresa un correo válido'
  }

  if (!PASSWORD_PATTERN.test(formData.password)) {
    return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo'
  }

  if (!formData.personalId || !formData.phoneNumber) {
    return 'Completa identificación y teléfono'
  }

  if (!DIGITS_ONLY_PATTERN.test(formData.personalId)) {
    return 'El documento de identidad debe contener solo números'
  }

  if (!DIGITS_ONLY_PATTERN.test(formData.phoneNumber)) {
    return 'El teléfono debe contener solo números'
  }

  if (formData.professionalLicense && !DIGITS_ONLY_PATTERN.test(formData.professionalLicense)) {
    return 'La licencia profesional debe contener solo números'
  }

  if (clientGuards && formData.password !== clientGuards.confirmPassword) {
    return 'Las contraseñas no coinciden'
  }

  if (clientGuards && !clientGuards.acceptedTerms) {
    return 'Debes aceptar los términos y la política de privacidad para registrarte'
  }

  return null
}
