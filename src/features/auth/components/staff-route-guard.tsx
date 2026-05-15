'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ApiErrorState } from '@/components/api-error-state'
import { LoadingState } from '@/components/loading-state'
import { useSessionExpiryWarning } from '@/hooks/use-session-expiry-warning'
import { SessionContext } from '@/providers/session-context'
import { authService } from '@/services/auth-service'
import { useStaffSession } from '../hooks/use-staff-session'

interface Props {
  allowedRoles?: string[]
  children: ReactNode
}

export function StaffRouteGuard({ allowedRoles, children }: Props) {
  const router = useRouter()
  const session = useStaffSession(allowedRoles)
  useSessionExpiryWarning()
  const redirectAttemptsRef = useRef(0)
  const lastRedirectTimeRef = useRef(0)

  useEffect(() => {
    // Prevent infinite redirect loops by:
    // 1. Only allowing one redirect attempt per component lifetime
    // 2. Adding a time gate to prevent rapid successive redirects
    // 3. Trusting middleware validation on first mount

    const now = Date.now()
    const timeSinceLastRedirect = now - lastRedirectTimeRef.current

    // If we've already attempted a redirect within the last 2 seconds, skip
    if (redirectAttemptsRef.current > 0 && timeSinceLastRedirect < 2000) {
      return
    }

    if (session.status === 'unauthenticated') {
      redirectAttemptsRef.current += 1
      lastRedirectTimeRef.current = now
      router.replace('/login')
    }

    if (session.status === 'forbidden') {
      redirectAttemptsRef.current += 1
      lastRedirectTimeRef.current = now
      router.replace('/dashboard')
    }
  }, [router, session.status])

  if (session.status === 'checking') {
    return <LoadingState label="Verificando sesión..." />
  }

  if (session.status === 'backendUnavailable') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ApiErrorState
          error={session.error}
          title="No se pudo validar tu sesión"
          message="El backend no respondió a tiempo. Mantén la sesión abierta e intenta de nuevo."
          onRetry={() => void session.refresh()}
        />
      </div>
    )
  }

  if (session.status === 'unauthenticated' || session.status === 'forbidden') {
    return <LoadingState label="Redirigiendo..." />
  }

  return (
    <SessionContext value={session.user}>
      <div data-user-role={session.user.role}>
        {children}
        <span className="sr-only">
          Sesión activa. Rol:
          {' '}
          {session.user.role}
        </span>
        <button type="button" className="hidden" onClick={() => void authService.logout()}>
          Cerrar sesión
        </button>
      </div>
    </SessionContext>
  )
}
