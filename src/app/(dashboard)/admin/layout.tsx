'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authService } from '@/services/auth-service'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth0()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isLoading)
      return

    async function checkRole() {
      try {
        if (!isAuthenticated && !authService.isAuthenticated()) {
          router.replace('/login')
          return
        }

        const user = await authService.getCurrentUser()
        if (!user) {
          if (isAuthenticated)
            router.replace('/callback')
          else
            router.replace('/login')
          return
        }

        if (user.role !== 'ADMIN') {
          router.replace('/dashboard')
          return
        }

        setAllowed(true)
      }
      catch {
        router.replace('/dashboard')
      }
    }

    void checkRole()
  }, [
    isAuthenticated,
    isLoading,
    router,
  ])

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
