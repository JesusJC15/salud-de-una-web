import type { RegisterFormClientGuardsInput } from '@/features/auth/validators/validate-register-doctor-form'
import type { RegisterDoctorDto } from '@/types'
import { useCallback, useState } from 'react'
import { INITIAL_REGISTER_DOCTOR_FORM } from '@/features/auth/constants/register-doctor-form'
import { sanitizeRegisterDoctorField } from '@/features/auth/utils/sanitize-register-doctor-field'
import {
  validateRegisterDoctorForm,
} from '@/features/auth/validators/validate-register-doctor-form'
import { authService } from '@/services/auth-service'

interface UseRegisterDoctorFormOptions {
  onSuccess?: () => void
}

export function useRegisterDoctorForm(options: UseRegisterDoctorFormOptions = {}) {
  const { onSuccess } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegisterDoctorDto>(INITIAL_REGISTER_DOCTOR_FORM)

  const updateField = useCallback((name: keyof RegisterDoctorDto, value: string) => {
    const sanitizedValue = sanitizeRegisterDoctorField(name, value)

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue,
    }))
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const submit = useCallback(async (clientGuards?: RegisterFormClientGuardsInput) => {
    setError(null)

    const validationError = validateRegisterDoctorForm(formData, clientGuards)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await authService.registerStaff({
        ...formData,
        professionalLicense: formData.professionalLicense || undefined,
      })

      await authService.loginStaff({
        email: formData.email,
        password: formData.password,
      })

      onSuccess?.()
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear la cuenta')
    }
    finally {
      setLoading(false)
    }
  }, [formData, onSuccess])

  return {
    loading,
    error,
    formData,
    clearError,
    updateField,
    submit,
  }
}
