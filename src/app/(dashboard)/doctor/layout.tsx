'use client'

import type { ReactNode } from 'react'
import { AuthenticatedDashboardLayout } from '@/components/dashboard/authenticated-dashboard-layout'
import { RoleRedirectGuard } from '@/features/auth/components/role-redirect-guard'

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRedirectGuard allowedRoles={['DOCTOR']}>
      <AuthenticatedDashboardLayout>{children}</AuthenticatedDashboardLayout>
    </RoleRedirectGuard>
  )
}
