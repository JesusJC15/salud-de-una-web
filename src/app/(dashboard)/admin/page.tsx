import type { Metadata } from 'next'
import { AdminHomePage } from '@/features/admin-home/pages/admin-home-page'

export const metadata: Metadata = {
  title: 'Panel de Administración — SaludDeUna',
}

export default function Page() {
  return <AdminHomePage />
}
