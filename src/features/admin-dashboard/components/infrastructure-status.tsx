import { Dot } from 'lucide-react'
import { ServerLoadBar } from './server-load-bar'

interface ServiceStatus {
  name: string
  status: string
}

const services: ServiceStatus[] = [{ name: 'API Gateway SaludDeUna', status: 'SALUDABLE' }, { name: 'Gemini Clinical Engine', status: 'ACTIVO' }]

interface InfrastructureStatusProps {
  serverLoad: number
}

export function InfrastructureStatus({ serverLoad }: InfrastructureStatusProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-4 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Estado de Infraestructura</h3>

      <div className="space-y-5">
        <ServerLoadBar value={serverLoad} />

        <div className="space-y-3">
          {services.map(service => (
            <article key={service.name} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-900/10">
              <div className="flex items-center gap-1.5">
                <Dot className="h-6 w-6 text-emerald-500" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{service.name}</p>
              </div>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-300">{service.status}</p>
            </article>
          ))}
        </div>

        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Ultimo backup realizado</p>
      </div>
    </section>
  )
}
