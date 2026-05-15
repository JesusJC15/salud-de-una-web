'use client'

import type { ReactNode } from 'react'
import { AuthenticatedDashboardLayout } from '@/components/dashboard/authenticated-dashboard-layout'
import { RoleRedirectGuard } from '@/features/auth/components/role-redirect-guard'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleRedirectGuard allowedRoles={['ADMIN']}>
      <AuthenticatedDashboardLayout>{children}</AuthenticatedDashboardLayout>
    </RoleRedirectGuard>
  )
}
