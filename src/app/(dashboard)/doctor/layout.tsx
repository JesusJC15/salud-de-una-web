'use client'

import type { ReactNode } from 'react'
import { RoleRedirectGuard } from '@/features/auth/components/role-redirect-guard'

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <RoleRedirectGuard allowedRoles={['DOCTOR']}>{children}</RoleRedirectGuard>
}
