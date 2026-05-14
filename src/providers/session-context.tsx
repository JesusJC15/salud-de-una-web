'use client'

import type { AuthMeUser } from '@/types/auth'
import { createContext, use } from 'react'

export const SessionContext = createContext<AuthMeUser | null>(null)

export function useSession(): AuthMeUser | null {
  return use(SessionContext)
}
