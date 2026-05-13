'use client'

import type { ReactNode } from 'react'
import { StaffRouteGuard } from '@/features/auth/components/staff-route-guard'

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <StaffRouteGuard allowedRoles={['DOCTOR']}>{children}</StaffRouteGuard>
}
