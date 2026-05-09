'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { authService } from '@/services/auth-service'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth0()
  const router = useRouter()

  useEffect(() => {
    if (isLoading)
      return
    if (!isAuthenticated && !authService.isAuthenticated()) {
      void router.replace('/login')
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

  if (!isAuthenticated && !authService.isAuthenticated()) {
    return null
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}
