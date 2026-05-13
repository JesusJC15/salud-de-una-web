'use client'

import type { ReactNode } from 'react'
import { StaffRouteGuard } from '@/features/auth/components/staff-route-guard'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <StaffRouteGuard allowedRoles={['ADMIN', 'DOCTOR']}>{children}</StaffRouteGuard>
}
