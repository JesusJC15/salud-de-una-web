import { PatientTimelinePanel } from '@/features/doctor-queue/components/patient-timeline-panel'

export default async function Page({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params

  return (
    <div className="mx-auto max-w-4xl p-6">
      <PatientTimelinePanel patientId={patientId} />
    </div>
  )
}
