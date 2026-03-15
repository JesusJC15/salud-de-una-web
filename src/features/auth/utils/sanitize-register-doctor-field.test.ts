import { sanitizeRegisterDoctorField } from '@/features/auth/utils/sanitize-register-doctor-field'

describe('sanitizeRegisterDoctorField', () => {
  it('keeps non-numeric fields unchanged', () => {
    expect(sanitizeRegisterDoctorField('firstName', 'Ana Maria')).toBe('Ana Maria')
  })

  it('removes non-digits from personalId', () => {
    expect(sanitizeRegisterDoctorField('personalId', '12A-34 B')).toBe('1234')
  })

  it('removes non-digits from phoneNumber', () => {
    expect(sanitizeRegisterDoctorField('phoneNumber', '+57 (300) 123-4567')).toBe('573001234567')
  })

  it('removes non-digits from professionalLicense', () => {
    expect(sanitizeRegisterDoctorField('professionalLicense', 'TP-99.88')).toBe('9988')
  })
})
