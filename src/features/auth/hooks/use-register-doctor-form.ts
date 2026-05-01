'use client'

import type { RegisterFormClientGuardsInput } from '@/features/auth/validators/validate-register-doctor-form'
import type { RegisterDoctorDto } from '@/types'
import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useState } from 'react'
import { INITIAL_REGISTER_DOCTOR_FORM } from '@/features/auth/constants/register-doctor-form'
import { sanitizeRegisterDoctorField } from '@/features/auth/utils/sanitize-register-doctor-field'
import {
  validateRegisterDoctorForm,
} from '@/features/auth/validators/validate-register-doctor-form'

interface UseRegisterDoctorFormOptions {
  onSuccess?: () => void
}

// Registration flow with Auth0:
// 1. Validate form client-side.
// 2. Save medical profile data to sessionStorage (survives the Auth0 redirect).
// 3. Redirect to Auth0 signup page.
// 4. Auth0 redirects back to /callback after account creation.
// 5. /callback reads sessionStorage and calls POST /auth/provision/doctor.
export function useRegisterDoctorForm(options: UseRegisterDoctorFormOptions = {}) {
  const { onSuccess } = options
  const { loginWithRedirect, isLoading: auth0Loading } = useAuth0()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RegisterDoctorDto>(INITIAL_REGISTER_DOCTOR_FORM)

  const updateField = useCallback((name: keyof RegisterDoctorDto, value: string) => {
    const sanitizedValue = sanitizeRegisterDoctorField(name, value)
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }))
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
      // Persist medical profile data across the Auth0 redirect
      const provisionPayload = {
        role: 'DOCTOR',
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialty: formData.specialty,
          personalId: formData.personalId,
          phoneNumber: formData.phoneNumber,
          professionalLicense: formData.professionalLicense || undefined,
        },
      }
      sessionStorage.setItem(
        'salud-de-una.pending-provision',
        JSON.stringify(provisionPayload),
      )

      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          login_hint: formData.email,
        },
      })

      onSuccess?.()
    }
    catch (err) {
      sessionStorage.removeItem('salud-de-una.pending-provision')
      setError(err instanceof Error ? err.message : 'No fue posible crear la cuenta')
    }
    finally {
      setLoading(false)
    }
  }, [
    formData,
    loginWithRedirect,
    onSuccess,
  ])

  return {
    loading: loading || auth0Loading,
    error,
    formData,
    clearError,
    updateField,
    submit,
  }
}
