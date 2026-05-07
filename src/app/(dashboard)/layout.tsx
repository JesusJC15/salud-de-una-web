'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { authService } from '@/services/auth-service'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth0()
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (isLoading)
      return

    if (!isAuthenticated && !authService.isAuthenticated()) {
      router.replace('/login')
      return
    }

    void authService.getCurrentUser().then((user) => {
      if (!user) {
        if (isAuthenticated)
          router.replace('/callback')
        else
          router.replace('/login')
        return
      }

      setVerified(true)
    })
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

  if (!verified)
    return null

  return <ErrorBoundary>{children}</ErrorBoundary>
}
