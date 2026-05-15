'use client'

import type { ReactNode } from 'react'
import { AuthenticatedDashboardFooter } from '@/components/dashboard/authenticated-dashboard-footer'

export function AuthenticatedDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex-1">{children}</main>
      <AuthenticatedDashboardFooter />
    </div>
  )
}
