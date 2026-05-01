'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Handles the Auth0 redirect after login/signup.
// After the callback is processed, reads pending provisioning data from
// sessionStorage (if any) and calls the backend provision endpoint.
export default function CallbackPage() {
  const { isLoading, isAuthenticated, error, getAccessTokenSilently } = useAuth0()
  const router = useRouter()
  const provisionedRef = useRef(false)

  useEffect(() => {
    if (isLoading || provisionedRef.current)
      return

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error.message)}`)
      return
    }

    if (!isAuthenticated)
      return

    async function handleCallback() {
      provisionedRef.current = true

      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE },
        })

        const pendingProvision = sessionStorage.getItem('salud-de-una.pending-provision')

        if (pendingProvision) {
          const payload = JSON.parse(pendingProvision) as { role: string, data: unknown }

          const endpoint
            = payload.role === 'DOCTOR'
              ? '/auth/provision/doctor'
              : '/auth/provision/patient'

          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'}/v1${endpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(payload.data),
            },
          )

          sessionStorage.removeItem('salud-de-una.pending-provision')
        }
      }
      catch {
        // Provisioning errors are non-fatal — the user can retry from the dashboard
      }

      router.replace('/dashboard')
    }

    void handleCallback()
  }, [
    isLoading,
    isAuthenticated,
    error,
    getAccessTokenSilently,
    router,
  ])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Verificando sesión...</p>
      </div>
    </div>
  )
}
