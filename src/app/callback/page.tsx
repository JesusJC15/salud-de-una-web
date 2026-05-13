'use client'

import type { AuthMeResponseDto, AuthMeUser } from '@/types/auth'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth0LoadingTimeout } from '@/features/auth/hooks/use-auth0-loading-timeout'
import { authService } from '@/services/auth-service'
import { UserRole } from '@/types/enums'
import envConfig from '@/utils/config/envConfig'

type CallbackState = 'loading' | 'provisioning' | 'error'

interface PendingProvision {
  role: 'DOCTOR' | 'PATIENT'
  data: unknown
}

type CurrentUserResult
  = | { kind: 'authenticated', user: AuthMeUser }
    | { kind: 'unauthenticated' }
    | { kind: 'backendUnavailable', message: string }

const PENDING_PROVISION_KEY = 'salud-de-una.pending-provision'
const PROVISION_ATTEMPTED_KEY = 'salud-de-una.provision-attempted'
const AUTH0_TIMEOUT_MS = 8000
const FETCH_TIMEOUT_MS = 15000

function routeForRole(role: AuthMeUser['role']): string {
  if (role === UserRole.ADMIN)
    return '/admin'
  if (role === UserRole.DOCTOR)
    return '/doctor'
  return '/dashboard'
}

function auth0ClaimsErrorMessage(): string {
  return 'La cuenta fue vinculada, pero el token de Auth0 aun no incluye los claims requeridos por el backend. Revisa la Action de Auth0 para emitir db_id y role, cierra sesion e intenta iniciar nuevamente.'
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  }
  finally {
    window.clearTimeout(timeout)
  }
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null) as { message?: string } | null
  if (typeof body?.message === 'string' && body.message.trim())
    return body.message
  return fallback
}

function readPendingProvision(): PendingProvision | null {
  const value = sessionStorage.getItem(PENDING_PROVISION_KEY)
  if (!value)
    return null

  try {
    const parsed = JSON.parse(value) as PendingProvision
    if ((parsed.role === 'DOCTOR' || parsed.role === 'PATIENT') && 'data' in parsed)
      return parsed
  }
  catch {
    // handled below
  }

  sessionStorage.removeItem(PENDING_PROVISION_KEY)
  throw new Error('La informacion temporal del registro Auth0 esta corrupta. Vuelve a iniciar el registro.')
}

async function fetchCurrentUser(baseUrl: string, token: string): Promise<CurrentUserResult> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json() as AuthMeResponseDto
      return { kind: 'authenticated', user: data.user }
    }

    if (res.status === 401 || res.status === 403)
      return { kind: 'unauthenticated' }

    return {
      kind: 'backendUnavailable',
      message: await readErrorMessage(res, `Backend respondio HTTP ${res.status} al validar la sesion`),
    }
  }
  catch (err) {
    return {
      kind: 'backendUnavailable',
      message: err instanceof Error && err.name === 'AbortError'
        ? 'El backend no respondio a tiempo al validar la sesion'
        : 'No fue posible conectar con el backend para validar la sesion',
    }
  }
}

export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, getAccessTokenSilently } = useAuth0()
  const router = useRouter()
  const auth0TimedOut = useAuth0LoadingTimeout(isLoading, AUTH0_TIMEOUT_MS)
  const handledRef = useRef(false)
  const [state, setState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if ((isLoading && !auth0TimedOut) || handledRef.current)
      return

    if (error) {
      sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
      router.replace(`/login?error=${encodeURIComponent(error.message)}`)
      return
    }

    if (!isAuthenticated) {
      queueMicrotask(() => {
        setErrorMessage(
          auth0TimedOut
            ? 'Auth0 no termino de inicializar la sesion. Verifica las variables NEXT_PUBLIC_AUTH0_* y la URL de callback.'
            : 'Auth0 no devolvio una sesion autenticada.',
        )
        setState('error')
      })
      return
    }

    async function getFreshToken() {
      const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
      return getAccessTokenSilently({
        authorizationParams: { audience },
        cacheMode: 'off',
      })
    }

    async function provisionWithAuth0(token: string, pendingProvision: PendingProvision | null) {
      const baseUrl = envConfig.apiBaseUrl
      const endpoint = pendingProvision?.role === 'PATIENT'
        ? '/auth/provision/patient'
        : '/auth/provision/doctor'

      const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(pendingProvision?.data ?? {}),
      })

      if (!res.ok) {
        throw new Error(
          await readErrorMessage(
            res,
            pendingProvision
              ? `Error ${res.status} al crear el perfil`
              : 'No fue posible vincular tu cuenta. Si eres administrador, tu acceso debe ser activado manualmente.',
          ),
        )
      }
    }

    async function handleCallback() {
      handledRef.current = true

      try {
        const baseUrl = envConfig.apiBaseUrl
        const pendingProvision = readPendingProvision()
        const token = await getFreshToken()

        if (pendingProvision) {
          setState('provisioning')
          sessionStorage.removeItem(PENDING_PROVISION_KEY)
          await provisionWithAuth0(token, pendingProvision)

          const freshToken = await getFreshToken()
          const current = await fetchCurrentUser(baseUrl, freshToken)

          if (current.kind === 'authenticated') {
            sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
            await authService.syncSession(freshToken)
            router.replace(routeForRole(current.user.role))
            return
          }

          throw new Error(
            current.kind === 'backendUnavailable'
              ? current.message
              : auth0ClaimsErrorMessage(),
          )
        }

        const current = await fetchCurrentUser(baseUrl, token)

        if (current.kind === 'authenticated') {
          sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
          await authService.syncSession(token)
          router.replace(routeForRole(current.user.role))
          return
        }

        if (current.kind === 'backendUnavailable')
          throw new Error(current.message)

        if (sessionStorage.getItem(PROVISION_ATTEMPTED_KEY)) {
          sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
          throw new Error(auth0ClaimsErrorMessage())
        }

        setState('provisioning')
        sessionStorage.setItem(PROVISION_ATTEMPTED_KEY, '1')
        await provisionWithAuth0(token, null)

        const freshToken = await getFreshToken()
        const linkedUser = await fetchCurrentUser(baseUrl, freshToken)

        if (linkedUser.kind === 'authenticated') {
          sessionStorage.removeItem(PROVISION_ATTEMPTED_KEY)
          await authService.syncSession(freshToken)
          router.replace(routeForRole(linkedUser.user.role))
          return
        }

        throw new Error(
          linkedUser.kind === 'backendUnavailable'
            ? linkedUser.message
            : auth0ClaimsErrorMessage(),
        )
      }
      catch (err) {
        const message = err instanceof Error ? err.message : 'Error al procesar el inicio de sesion'
        setErrorMessage(message)
        setState('error')
      }
    }

    void handleCallback()
  }, [
    isLoading,
    auth0TimedOut,
    isAuthenticated,
    error,
    getAccessTokenSilently,
    router,
  ])

  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-800">Error al completar el inicio de sesion</p>
          <p className="text-xs text-slate-500">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="text-sm text-teal-600 underline hover:text-teal-700"
          >
            Volver al inicio de sesion
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
          {state === 'provisioning' ? 'Vinculando tu cuenta...' : 'Verificando sesion...'}
        </p>
      </div>
    </div>
  )
}
