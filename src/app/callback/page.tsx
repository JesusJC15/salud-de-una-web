'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type ProvisionState = 'loading' | 'error'

const CLAIM_NS = 'https://salud-de-una.com/'
const BASE64_PLUS = /-/g
const BASE64_SLASH = /_/g
const TRAILING_SLASH = /\/+$/

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1]
    if (!part)
      return {}
    return JSON.parse(atob(part.replace(BASE64_PLUS, '+').replace(BASE64_SLASH, '/'))) as Record<string, unknown>
  }
  catch {
    return {}
  }
}

export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, getAccessTokenSilently } = useAuth0()
  const router = useRouter()
  const handledRef = useRef(false)
  const [state, setState] = useState<ProvisionState>('loading')
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
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000').replace(TRAILING_SLASH, '')

        const token = await getAccessTokenSilently({ authorizationParams: { audience } })
        const claims = decodeJwtPayload(token)
        const dbId = claims[`${CLAIM_NS}db_id`] as string | undefined

        const pendingProvision = sessionStorage.getItem('salud-de-una.pending-provision')

        if (pendingProvision) {
          // ── Case 1: new signup — provision with form data saved before redirect ──
          // Always remove from sessionStorage first — even on failure — so a
          // subsequent login attempt doesn't replay the same broken provision data.
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

          // Refresh token so the new db_id claim is included
          await getAccessTokenSilently({ authorizationParams: { audience }, cacheMode: 'off' })
        }
        else if (!dbId) {
          // ── Case 2: existing legacy doctor logging in via Auth0 for the first time ──
          // The endpoint finds them by email and links their Auth0 account — no body needed.
          const res = await fetch(`${baseUrl}/v1/auth/provision/doctor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({}),
          })

          if (!res.ok) {
            const body = await res.json().catch(() => ({ message: 'Error desconocido' })) as { message?: string }
            throw new Error(body.message ?? `Error ${res.status} al vincular la cuenta`)
          }

          // Refresh token so db_id claim is now present
          await getAccessTokenSilently({ authorizationParams: { audience }, cacheMode: 'off' })
        }
        // ── Case 3: returning user with valid db_id — nothing to do ──

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
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    </div>
  )
}
