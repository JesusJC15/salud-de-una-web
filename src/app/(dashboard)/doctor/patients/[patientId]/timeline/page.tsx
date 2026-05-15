import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { PatientTimelinePanel } from '@/features/doctor-queue/components/patient-timeline-panel'

export default async function Page({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/doctor/queue"
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a la cola
        </Link>
        <Link
          href="/doctor"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
        >
          Panel médico
        </Link>
      </div>
      <PatientTimelinePanel patientId={patientId} />
    </div>
  )
}
