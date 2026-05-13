'use client'

import type { ReactNode } from 'react'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useReportWebVitals } from 'next/web-vitals'
import { useEffect, useState } from 'react'
import { clientLogger } from '@/lib/client-logger'
import { authService, initAuthService } from '@/services/auth-service'

// Wires the Auth0 SDK to the authService singleton so api-client.ts can call
// authService.getAccessToken() without needing React context.
function AuthServiceInitializer() {
  const { getAccessTokenSilently, logout, isAuthenticated } = useAuth0()

  useEffect(() => {
    initAuthService(
      () =>
        getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          },
        }),
      logout,
      isAuthenticated,
    )
  }, [
    getAccessTokenSilently,
    logout,
    isAuthenticated,
  ])

  useEffect(() => {
    if (!isAuthenticated) {
      void authService.syncClientSession(null)
      return
    }

    void getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
      },
    }).then((token) => {
      return authService.syncClientSession(token)
    }).catch(() => {
      return authService.syncClientSession(null)
    })
  }, [getAccessTokenSilently, isAuthenticated])

  return null
}

function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    void clientLogger.log({
      level: 'info',
      message: 'web-vital',
      component: 'WebVitalsReporter',
      metadata: {
        id: metric.id,
        name: metric.name,
        rating: metric.rating,
        value: Math.round(metric.value),
      },
    })
  })

  return null
}

export function Auth0ClientProvider({ children }: { children: ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? ''
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? ''
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
  const redirectUri
    = process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI
      ?? (typeof window !== 'undefined' ? `${window.location.origin}/callback` : '')

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchIntervalInBackground: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: redirectUri,
          audience,
          scope: 'openid profile email offline_access',
        }}
        useRefreshTokens
        cacheLocation="memory"
      >
        <AuthServiceInitializer />
        <WebVitalsReporter />
        {children}
      </Auth0Provider>
    </QueryClientProvider>
  )
}
