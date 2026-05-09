'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { trimTrailingSlashes } from '@/lib/utils'
import { authService } from '@/services/auth-service'

type CallbackState = 'loading' | 'provisioning' | 'error'

// Prevents re-entering the auto-provision block after a page reload.
// If the reloaded token still lacks db_id we stop and show an error.
const PROVISION_ATTEMPTED_KEY = 'salud-de-una.provision-attempted'

export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, getAccessTokenSilently } = useAuth0()
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
        const currentUser = await authService.getCurrentUser(token)

        // ── Auto-provision: Auth0 account not yet linked to MongoDB ───────────
        // Happens when the user registered with email/password and this is
        // their first Auth0 login. app_metadata.db_id hasn't been set yet
        // so the token carries no db_id claim.
        if (!currentUser && !pendingProvision) {
          // Loop guard: if we already provisioned and reloaded but db_id
          // is still missing, stop and show an error.
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
          // We need a fresh token that includes the new claim. The safest
          // approach is a full page reload: the Auth0 SDK re-initialises
          // with an empty in-memory cache, uses the refresh token to
          // obtain a new access token, and the Post-Login Action injects
          // db_id from the freshly-written app_metadata.
          //
          // We do NOT use loginWithRedirect here — calling it inside a
          // useEffect with Auth0 SDK functions in the dependency array
          // can trigger an infinite re-render loop that freezes the browser.
          sessionStorage.setItem(PROVISION_ATTEMPTED_KEY, '1')
          window.location.reload()
          return
        }

        if (!currentUser) {
          throw new Error('No fue posible vincular tu cuenta con un perfil de SaludDeUna')
        }

        // Success — clean up guard, sync session cookie, navigate to app.
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
