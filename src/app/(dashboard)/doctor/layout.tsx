'use client'

import type { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { decodeJwt } from 'jose'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { authService } from '@/services/auth-service'

const NS = 'https://salud-de-una.com/'

export default function DoctorLayout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const router = useRouter()
  const [roleChecked, setRoleChecked] = useState(false)

  useEffect(() => {
    if (isLoading)
      return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    async function checkRole() {
      try {
        const token = await authService.getAccessToken() ?? await getAccessTokenSilently()
        if (!token) {
          router.replace('/dashboard')
          return
        }

        const claims = decodeJwt(token) as Record<string, unknown>
        const role = claims[`${NS}role`] as string | undefined

        if (role !== 'DOCTOR') {
          router.replace('/dashboard')
          return
        }
        setRoleChecked(true)
      }
      catch {
        router.replace('/dashboard')
      }
    }

    void checkRole()
  }, [
    isLoading,
    isAuthenticated,
    router,
    getAccessTokenSilently,
  ])

  if (isLoading || !roleChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
