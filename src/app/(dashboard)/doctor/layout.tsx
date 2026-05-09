'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { authService } from '@/services/auth-service'

export default function DoctorLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth0()
  const router = useRouter()
  const [roleChecked, setRoleChecked] = useState(false)
  const checkingRef = useRef(false)

  useEffect(() => {
    if (isLoading)
      return
    if (!isAuthenticated && !authService.isAuthenticated()) {
      void router.replace('/login')
      return
    }

    // Prevent duplicate concurrent calls (React strict mode or rapid state changes)
    if (checkingRef.current)
      return
    checkingRef.current = true

    async function checkRole() {
      try {
        const user = await authService.getCurrentUser()
        if (!user) {
          void router.replace(isAuthenticated ? '/callback' : '/login')
          return
        }
        if (user.role !== 'DOCTOR') {
          void router.replace('/dashboard')
          return
        }
        setRoleChecked(true)
      }
      catch (err) {
        console.error('[DoctorLayout] Role check failed:', err)
        void router.replace('/dashboard')
      }
      finally {
        checkingRef.current = false
      }
    }

    void checkRole()
  // eslint-disable-next-line react/exhaustive-deps
  }, [isLoading, isAuthenticated])

  if (isLoading || !roleChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
