import { validateRegisterDoctorForm } from '@/features/auth/validators/validate-register-doctor-form'
import { Specialty } from '@/types/enums'

const VALID_TEST_PASSWORD = [
  'Pass',
  'word',
  '1!',
].join('')
const INVALID_TEST_PASSWORD = ['password', '1'].join('')

const VALID_FORM = {
  firstName: 'Ana',
  lastName: 'Perez',
  email: 'ana@clinica.com',
  password: VALID_TEST_PASSWORD,
  specialty: Specialty.GENERAL_MEDICINE,
  personalId: '1234567890',
  phoneNumber: '3001234567',
  professionalLicense: '987654',
}

describe('validateRegisterDoctorForm', () => {
  it('returns null for a valid payload', () => {
    expect(validateRegisterDoctorForm(VALID_FORM)).toBeNull()
  })

  it('validates required fields', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, firstName: '' })).toBe('Completa los campos obligatorios')
  })

  it('validates email format', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, email: 'correo-invalido' })).toBe('Ingresa un correo válido')
  })

  it('validates password complexity', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, password: INVALID_TEST_PASSWORD })).toBe(
      'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo',
    )
  })

  it('requires identity and phone', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, personalId: '', phoneNumber: '' })).toBe(
      'Completa identificación y teléfono',
    )
  })

  it('rejects non-numeric personal id', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, personalId: 'ABC-123' })).toBe(
      'El documento de identidad debe contener solo números',
    )
  })

  it('rejects non-numeric phone number', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, phoneNumber: '300-ABC-567' })).toBe(
      'El teléfono debe contener solo números',
    )
  })

  it('rejects non-numeric professional license when present', () => {
    expect(validateRegisterDoctorForm({ ...VALID_FORM, professionalLicense: 'AB-123' })).toBe(
      'La tarjeta profesional debe contener solo números',
    )
  })
})
