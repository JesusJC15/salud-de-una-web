'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { trimTrailingSlashes } from '@/lib/utils'
import { authService } from '@/services/auth-service'

type CallbackState = 'loading' | 'provisioning' | 'error'

// Guard key that prevents re-entering the auto-provision loop if Auth0's
// silent re-auth somehow returns a token that still lacks db_id.
const PROVISION_ATTEMPTED_KEY = 'salud-de-una.provision-attempted'

export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, getAccessTokenSilently, loginWithRedirect } = useAuth0()
  const router = useRouter()
  const handledRef = useRef(false)
  const [state, setState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (isLoading || handledRef.current)
      return

    if (error) {
      sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
      router.replace(`/login?error=${encodeURIComponent(error.message)}`)
      return
    }

    if (!isAuthenticated)
      return

    async function handleCallback() {
      handledRef.current = true

      try {
        const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
        const baseUrl = trimTrailingSlashes(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000')

        // Auth0 issues a fresh token for this page load; the SDK caches it.
        const token = await getAccessTokenSilently({ authorizationParams: { audience } })
        const pendingProvision = sessionStorage.getItem('salud-de-una.pending-provision')

        // ── Explicit provision from registration form ─────────────────────────
        if (pendingProvision) {
          sessionStorage.removeItem('salud-de-una.pending-provision')

          const payload = JSON.parse(pendingProvision) as { role: string, data: unknown }
          const endpoint = payload.role === 'DOCTOR' ? '/auth/provision/doctor' : '/auth/provision/patient'

          const res = await fetch(`${baseUrl}/v1${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload.data),
          })

          if (!res.ok) {
            const body = await res.json().catch(() => ({ message: 'Error desconocido' })) as { message?: string }
            throw new Error(body.message ?? `Error ${res.status} al crear el perfil`)
          }
        }

        // ── Try to get the current user ───────────────────────────────────────
        let currentUser = await authService.getCurrentUser(token)

        // ── Auto-provision: Auth0 account not yet linked to MongoDB ───────────
        // This happens when a user registered with email/password and then logs
        // in via Auth0 for the first time. Their MongoDB record exists but
        // app_metadata.db_id hasn't been set, so the token has no db_id claim.
        if (!currentUser && !pendingProvision) {
          // Loop guard: if we already tried once (silent re-auth came back but
          // still no db_id), stop and show an error.
          if (sessionStorage.getItem(PROVISION_ATTEMPTED_KEY)) {
            sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
            throw new Error(
              'No fue posible vincular tu cuenta. Verificá que el doctor esté registrado o contactá al administrador.',
            )
          }

          setState('provisioning')

          const provisionRes = await fetch(`${baseUrl}/v1/auth/provision/doctor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({}),
          })

          if (!provisionRes.ok) {
            const body = await provisionRes.json().catch(() => ({})) as { message?: string }
            throw new Error(
              body.message
              ?? 'No fue posible vincular tu cuenta. Si sos administrador, tu acceso debe ser activado manualmente.',
            )
          }

          // Provisioning updated app_metadata.db_id in Auth0.
          // The current token cache holds the old token (no db_id) — using
          // cacheMode:'off' bypasses the cache but does NOT update it, so the
          // AuthServiceInitializer on the next page would re-sync the cookie
          // with the stale cached token, breaking middleware validation.
          //
          // Instead, force a full silent re-authentication: Auth0 runs the
          // Post-Login Action again on a fresh token request, picking up the
          // new db_id from app_metadata and caching the result. The next visit
          // to /callback will have a valid token and complete normally.
          sessionStorage.setItem(PROVISION_ATTEMPTED_KEY, '1')
          await loginWithRedirect({
            authorizationParams: { audience, prompt: 'none' },
          })
          return
        }

        if (!currentUser) {
          throw new Error('No fue posible vincular tu cuenta con un perfil de SaludDeUna')
        }

        // Success — clean up guard flag, sync session cookie, navigate.
        sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
        await authService.syncClientSession(token)
        router.replace('/dashboard')
      }
      catch (err) {
        const message = err instanceof Error ? err.message : 'Error al procesar el inicio de sesión'
        setErrorMessage(message)
        setState('error')
      }
    }

    void handleCallback()
  }, [
    isLoading,
    isAuthenticated,
    error,
    getAccessTokenSilently,
    loginWithRedirect,
    router,
  ])

  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-800">Error al completar el inicio de sesión</p>
          <p className="text-xs text-slate-500">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="text-sm text-teal-600 underline hover:text-teal-700"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-slate-500">
          {state === 'provisioning' ? 'Vinculando tu cuenta...' : 'Verificando sesión...'}
        </p>
      </div>
    </div>
  )
}
