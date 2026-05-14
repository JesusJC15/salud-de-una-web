'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingState } from '@/components/loading-state'
import { useSession } from '@/providers/session-context'

interface Props {
  allowedRoles: string[]
  children: ReactNode
}

/**
 * Reads the authenticated user from SessionContext (set by the parent
 * StaffRouteGuard) and redirects if the role is not in allowedRoles.
 * Does NOT call /auth/me — zero extra network requests.
 */
export function RoleRedirectGuard({ allowedRoles, children }: Props) {
  const user = useSession()
  const router = useRouter()

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard')
    }
  }, [
    user,
    router,
    allowedRoles,
  ])

  if (!user) {
    return <LoadingState label="Verificando acceso..." />
  }

  if (!allowedRoles.includes(user.role)) {
    return <LoadingState label="Redirigiendo..." />
  }

  return <>{children}</>
}
