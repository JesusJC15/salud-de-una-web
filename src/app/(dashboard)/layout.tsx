'use client'

import type { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { StaffRouteGuard } from '@/features/auth/components/staff-route-guard'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <StaffRouteGuard allowedRoles={['ADMIN', 'DOCTOR']}>
        {children}
      </StaffRouteGuard>
    </ErrorBoundary>
  )
}
