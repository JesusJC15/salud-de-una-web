import type { ActivityFeedItem } from './activity-item'
import { AlertTriangle, CheckCircle2, Settings2, UserPlus2 } from 'lucide-react'
import { ActivityItem } from './activity-item'

const activityItems: ActivityFeedItem[] = [
  {
    id: 'ADM-9421',
    icon: CheckCircle2,
    message: 'Admin aprobo al Dr. Carlos Ruiz',
    timestamp: 'Hace 12 minutos',
    statusLabel: '#ADM-9421',
  },
  {
    id: 'REG-3312',
    icon: UserPlus2,
    message: 'Nuevo medico registrado: Dra. Elena Gomez',
    timestamp: 'Hace 45 minutos',
    statusLabel: '#REG-3312',
  },
  {
    id: 'GRA-440',
    icon: AlertTriangle,
    message: 'Alerta de Guardrail IA detectada - Intento de bypass en triage',
    timestamp: 'Hace 1 hora',
    statusLabel: 'Critico',
    statusTone: 'danger',
  },
  {
    id: 'CFG-102',
    icon: Settings2,
    message: 'Actualizacion de parametros de Red Flags: Odontologia',
    timestamp: 'Hace 2 horas',
    statusLabel: '#CFG-102',
  },
]

export function ActivityFeed() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Actividad Reciente del Sistema</h3>
        <button type="button" className="text-sm font-bold text-teal-500 transition-colors hover:text-teal-600">
          Ver Todo
        </button>
      </div>

      <div>
        {activityItems.map(item => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
