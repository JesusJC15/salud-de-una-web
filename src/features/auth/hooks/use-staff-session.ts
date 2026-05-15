'use client'

import type { AuthMeUser } from '@/types/auth'
import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiClientError } from '@/api/api-client'
import { useAuth0LoadingTimeout } from '@/features/auth/hooks/use-auth0-loading-timeout'
import { authService } from '@/services/auth-service'

export type StaffSessionState
  = | { status: 'checking', user: null }
    | { status: 'authenticated', user: AuthMeUser }
    | { status: 'forbidden', user: AuthMeUser | null }
    | { status: 'unauthenticated', user: null }
    | { status: 'backendUnavailable', error: Error, user: null }

const MAX_RETRY_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000 // Wait before retrying

export function useStaffSession(allowedRoles?: string[]) {
  const { isLoading } = useAuth0()
  const [state, setState] = useState<StaffSessionState>({ status: 'checking', user: null })
  const auth0Disabled = process.env.NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK === 'true'
  const auth0TimedOut = useAuth0LoadingTimeout(isLoading, 3500)
  const auth0IsLoading = !auth0Disabled && isLoading && !auth0TimedOut
  const allowedRolesKey = allowedRoles?.join('|') ?? ''
  const allowedRoleSet = useMemo(
    () => new Set(allowedRolesKey ? allowedRolesKey.split('|') : []),
    [allowedRolesKey],
  )
  const requiresRoleCheck = allowedRoleSet.size > 0
  const retryCountRef = useRef(0)
  const isRefreshingRef = useRef(false)

  const refresh = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) {
      return
    }

    if (auth0IsLoading) {
      setState({ status: 'checking', user: null })
      return
    }

    // Do NOT use authService.isAuthenticated() as a gate here.
    // In production, it returns false for legacy sessions because sessionStorage
    // is disabled — but getCurrentUser() correctly reads the httpOnly BFF cookie
    // via GET /api/session, which is the source of truth for legacy tokens.
    setState({ status: 'checking', user: null })

    isRefreshingRef.current = true
    try {
      const user = await authService.getCurrentUser()
      if (!user) {
        // Only mark as unauthenticated after retries are exhausted
        if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
          retryCountRef.current += 1
          // Schedule a retry after a delay
          setTimeout(() => {
            isRefreshingRef.current = false
            void refresh()
          }, RETRY_DELAY_MS)
          return
        }
        setState({ status: 'unauthenticated', user: null })
        return
      }

      if (requiresRoleCheck && !allowedRoleSet.has(user.role)) {
        setState({ status: 'forbidden', user })
        return
      }

      // Success - reset retry counter
      retryCountRef.current = 0
      setState({ status: 'authenticated', user })
    }
    catch (error) {
      const nextError = error instanceof Error ? error : new Error('No fue posible validar la sesión')
      if (nextError instanceof ApiClientError && (nextError.status === 401 || nextError.status === 403)) {
        // Auth errors - mark as unauthenticated without retry
        retryCountRef.current = 0
        setState({ status: 'unauthenticated', user: null })
        return
      }

      // Network or backend errors - allow retries
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current += 1
        // Schedule a retry after a delay
        setTimeout(() => {
          isRefreshingRef.current = false
          void refresh()
        }, RETRY_DELAY_MS)
        return
      }

      setState({ status: 'backendUnavailable', error: nextError, user: null })
    }
    finally {
      isRefreshingRef.current = false
    }
  }, [
    allowedRoleSet,
    auth0IsLoading,
    requiresRoleCheck,
  ])

  useEffect(() => {
    // Reset retry counter on mount
    retryCountRef.current = 0
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
