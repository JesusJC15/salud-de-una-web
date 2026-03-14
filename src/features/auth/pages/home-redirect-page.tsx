'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { authService } from '@/services/auth-service'

export function HomeRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard')
    }
    else {
      router.push('/login')
    }
  }, [router])

  return null
}
