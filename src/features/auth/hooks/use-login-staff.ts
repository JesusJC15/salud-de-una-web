'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authService } from '@/services/auth-service'
import envConfig from '@/utils/config/envConfig'

interface LoginStaffResponse {
  accessToken: string
  refreshToken: string
  user: { id: string, email: string, role: string }
}

export function useLoginStaff() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    setError(null)

    if (!email || !password) {
      setError('Ingresa tu correo y contraseña')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${envConfig.apiBaseUrl}/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(
          Array.isArray(payload.message)
            ? (payload.message as string[]).join(', ')
            : (payload.message ?? 'Credenciales incorrectas'),
        )
      }

      const data = await res.json() as LoginStaffResponse
      authService.initLegacySession(data.accessToken, data.refreshToken)
      router.push('/dashboard')
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión')
    }
    finally {
      setLoading(false)
    }
  }

  const clearError = () => setError(null)

  return { login, loading, error, clearError }
}
