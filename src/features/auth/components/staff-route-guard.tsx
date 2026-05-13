'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ApiErrorState } from '@/components/api-error-state'
import { LoadingState } from '@/components/loading-state'
import { authService } from '@/services/auth-service'
import { useStaffSession } from '../hooks/use-staff-session'

interface Props {
  allowedRoles?: string[]
  children: ReactNode
}

export function StaffRouteGuard({ allowedRoles, children }: Props) {
  const router = useRouter()
  const session = useStaffSession(allowedRoles)

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.replace('/login')
    }
    if (session.status === 'forbidden') {
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
  )
}
