import { AdminDoctorVerifyPage } from '@/features/admin-console/pages/admin-doctor-verify-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminDoctorVerifyPage doctorId={id} />
}
