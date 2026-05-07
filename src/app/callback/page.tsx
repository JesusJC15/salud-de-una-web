'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { trimTrailingSlashes } from '@/lib/utils'
import { authService } from '@/services/auth-service'

type CallbackState = 'loading' | 'provisioning' | 'error'

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
        let currentUser = await authService.getCurrentUser(token)

        // ── Auto-provision: account exists in Auth0 but not yet linked ────────
        // Happens when a user registered with email/password and then logs in
        // with Auth0 for the first time — their MongoDB record exists but
        // app_metadata.db_id hasn't been set yet.
        if (!currentUser && !pendingProvision) {
          setState('provisioning')

          const provisionRes = await fetch(`${baseUrl}/v1/auth/provision/doctor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({}),
          })

          if (provisionRes.ok) {
            // Provisioning set app_metadata.db_id in Auth0.
            // Get a fresh token so the Post-Login Action injects the new claims.
            const freshToken = await getAccessTokenSilently({
              authorizationParams: { audience },
              cacheMode: 'off',
            })
            currentUser = await authService.getCurrentUser(freshToken)
            if (currentUser) {
              await authService.syncClientSession(freshToken)
              router.replace('/dashboard')
              return
            }

            // Provisioning succeeded but still no session: Post-Login Action
            // not yet deployed in Auth0. Guide the user.
            throw new Error(
              'Tu cuenta fue vinculada correctamente. Cerrá sesión en Auth0 y volvé a iniciar sesión para completar el proceso.',
            )
          }
          else {
            // Not a doctor — may be an admin or a patient using the wrong portal
            const body = await provisionRes.json().catch(() => ({})) as { message?: string }
            throw new Error(
              body.message
              ?? 'No fue posible vincular tu cuenta. Si sos administrador, tu acceso debe ser activado manualmente.',
            )
          }
        }

        if (!currentUser) {
          throw new Error('No fue posible vincular tu cuenta con un perfil de SaludDeUna')
        }

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
