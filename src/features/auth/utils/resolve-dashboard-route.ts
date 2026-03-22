import { UserRole } from '@/types/enums'

export function resolveDashboardRoute(role: UserRole | null | undefined) {
  if (role === UserRole.ADMIN) {
    return '/dashboard/admin'
  }

  return '/dashboard'
}
