'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { authService } from '@/services/auth-service'

// Auth guard for /dashboard and all its sub-routes.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth0()
  const router = useRouter()

  useEffect(() => {
    if (isLoading)
      return
    // Support both Auth0 sessions and legacy JWT sessions
    if (!isAuthenticated && !authService.isAuthenticated()) {
      router.replace('/login')
    }
  }, [
    isLoading,
    isAuthenticated,
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
