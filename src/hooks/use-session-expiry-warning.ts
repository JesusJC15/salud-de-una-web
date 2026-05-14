'use client'

import { decodeJwt } from 'jose'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth-service'

const WARNING_BEFORE_MS = 5 * 60 * 1000

export function useSessionExpiryWarning(): void {
  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | null = null

    async function schedule() {
      const token = await authService.getAccessToken()
      if (!token)
        return
      try {
        const { exp } = decodeJwt(token)
        if (!exp)
          return
        const msUntilWarning = exp * 1000 - Date.now() - WARNING_BEFORE_MS
        if (msUntilWarning <= 0)
          return
        id = setTimeout(() => {
          toast(
            'Tu sesión expira en 5 min. Si estás en una consulta, guardá tu trabajo antes de que se cierre.',
            { icon: '⏱', duration: 15_000 },
          )
        }, msUntilWarning)
      }
      catch {
        // Token no decodificable — ignorar
      }
    }

    void schedule()
    return () => {
      if (id)
        clearTimeout(id)
    }
  }, [])
}
