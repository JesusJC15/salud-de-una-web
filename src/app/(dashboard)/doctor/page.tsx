import type { Metadata } from 'next'
import { DoctorPortalPage } from '@/features/doctor-home/pages/doctor-portal-page'

export const metadata: Metadata = {
  title: 'Panel del Médico — SaludDeUna',
}

export default function DoctorPage() {
  return <DoctorPortalPage />
}
