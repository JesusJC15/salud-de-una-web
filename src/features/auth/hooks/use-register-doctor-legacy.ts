'use client'

import type { RegisterFormClientGuardsInput } from '@/features/auth/validators/validate-register-doctor-form'
import type { RegisterDoctorDto } from '@/types'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { apiClient } from '@/api/api-client'
import { INITIAL_REGISTER_DOCTOR_FORM } from '@/features/auth/constants/register-doctor-form'
import { sanitizeRegisterDoctorField } from '@/features/auth/utils/sanitize-register-doctor-field'
import {

  validateRegisterDoctorForm,
} from '@/features/auth/validators/validate-register-doctor-form'

export function useRegisterDoctorLegacy() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegisterDoctorDto>(INITIAL_REGISTER_DOCTOR_FORM)

  const updateField = useCallback((name: keyof RegisterDoctorDto, value: string) => {
    setFormData(prev => ({ ...prev, [name]: sanitizeRegisterDoctorField(name, value) }))
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const submit = useCallback(async (clientGuards?: RegisterFormClientGuardsInput) => {
    setError(null)

    const validationError = validateRegisterDoctorForm(formData, clientGuards)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await apiClient('').post('auth/doctor/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        specialty: formData.specialty,
        personalId: formData.personalId,
        phoneNumber: formData.phoneNumber,
        professionalLicense: formData.professionalLicense || undefined,
      }, false)

      router.push('/login?registered=1')
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear la cuenta')
    }
    finally {
      setLoading(false)
    }
  }, [formData, router])

  return { loading, error, formData, clearError, updateField, submit }
}
