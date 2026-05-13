'use client'

import type { AuthMeUser } from '@/types/auth'
import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiClientError } from '@/api/api-client'
import { useAuth0LoadingTimeout } from '@/features/auth/hooks/use-auth0-loading-timeout'
import { authService } from '@/services/auth-service'

export type StaffSessionState
  = | { status: 'checking', user: null }
    | { status: 'authenticated', user: AuthMeUser }
    | { status: 'forbidden', user: AuthMeUser | null }
    | { status: 'unauthenticated', user: null }
    | { status: 'backendUnavailable', error: Error, user: null }

export function useStaffSession(allowedRoles?: string[]) {
  const { isAuthenticated, isLoading } = useAuth0()
  const [state, setState] = useState<StaffSessionState>({ status: 'checking', user: null })
  const auth0Disabled = process.env.NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK === 'true'
  const auth0TimedOut = useAuth0LoadingTimeout(isLoading, 3500)
  const auth0IsLoading = !auth0Disabled && isLoading && !auth0TimedOut
  const auth0IsAuthenticated = !auth0Disabled && isAuthenticated
  const allowedRolesKey = allowedRoles?.join('|') ?? ''
  const allowedRoleSet = useMemo(
    () => new Set(allowedRolesKey ? allowedRolesKey.split('|') : []),
    [allowedRolesKey],
  )
  const requiresRoleCheck = allowedRoleSet.size > 0

  const refresh = useCallback(async () => {
    if (auth0IsLoading) {
      setState({ status: 'checking', user: null })
      return
    }

    if (!auth0IsAuthenticated && !authService.isAuthenticated()) {
      setState({ status: 'unauthenticated', user: null })
      return
    }

    setState({ status: 'checking', user: null })

    try {
      const user = await authService.getCurrentUser()
      if (!user) {
        setState({ status: 'unauthenticated', user: null })
        return
      }

      if (requiresRoleCheck && !allowedRoleSet.has(user.role)) {
        setState({ status: 'forbidden', user })
        return
      }

      setState({ status: 'authenticated', user })
    }
    catch (error) {
      const nextError = error instanceof Error ? error : new Error('No fue posible validar la sesión')
      if (nextError instanceof ApiClientError && (nextError.status === 401 || nextError.status === 403)) {
        setState({ status: 'unauthenticated', user: null })
        return
      }
      setState({ status: 'backendUnavailable', error: nextError, user: null })
    }
  }, [
    allowedRoleSet,
    auth0IsAuthenticated,
    auth0IsLoading,
    requiresRoleCheck,
  ])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
