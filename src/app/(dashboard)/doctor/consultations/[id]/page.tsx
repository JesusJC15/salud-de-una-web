import { DoctorConsultationPage } from '@/features/doctor-queue/pages/doctor-consultation-page'

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DoctorConsultationPage consultationId={id} />
}
