'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { authService } from '@/services/auth-service'

const CLAIM_NS = 'https://salud-de-una.com/'
const BASE64_PLUS = /-/g
const BASE64_SLASH = /_/g

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1]
    if (!part)
      return {}
    return JSON.parse(atob(part.replace(BASE64_PLUS, '+').replace(BASE64_SLASH, '/'))) as Record<string, unknown>
  }
  catch { return {} }
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const router = useRouter()

  useEffect(() => {
    if (isLoading)
      return

    // Not authenticated at all → login
    if (!isAuthenticated && !authService.isAuthenticated()) {
      router.replace('/login')
      return
    }

    // Auth0 session: verify the token has db_id (i.e. provisioning completed)
    if (isAuthenticated) {
      void getAccessTokenSilently({
        authorizationParams: { audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE },
      }).then((token) => {
        const claims = decodeJwtPayload(token)
        const dbId = claims[`${CLAIM_NS}db_id`] as string | undefined
        const role = claims[`${CLAIM_NS}role`] as string | undefined

        if (!dbId || !role) {
          // Token exists but provisioning never completed — redirect to /callback
          // which will attempt auto-linking for existing legacy accounts
          router.replace('/callback')
        }
      }).catch(() => {
        router.replace('/login')
      })
    }
  }, [
    isLoading,
    isAuthenticated,
    getAccessTokenSilently,
    router,
  ])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated && !authService.isAuthenticated())
    return null

  return <>{children}</>
}
