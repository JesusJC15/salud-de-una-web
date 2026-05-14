'use client'

import type { ReactNode } from 'react'
import { RoleRedirectGuard } from '@/features/auth/components/role-redirect-guard'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleRedirectGuard allowedRoles={['ADMIN']}>{children}</RoleRedirectGuard>
}
