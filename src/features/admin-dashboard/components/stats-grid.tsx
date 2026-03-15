import { Activity, AlertTriangle, ShieldCheck, UserRoundCog } from 'lucide-react'
import { StatsCard } from './stats-card'

export interface AdminStatsSnapshot {
  activeConsultations: number
  guardrailAlerts: number
  pendingDoctors: number
  validationsToday: number
}

interface StatsGridProps {
  stats: AdminStatsSnapshot
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Medicos Pendientes"
        value={stats.pendingDoctors}
        icon={AlertTriangle}
        accent="warning"
        helperText="RETHUS"
      />
      <StatsCard
        title="Validaciones Hoy"
        value={stats.validationsToday}
        icon={ShieldCheck}
        accent="success"
        helperText="+5% hoy"
      />
      <StatsCard
        title="Consultas Activas"
        value={stats.activeConsultations}
        icon={UserRoundCog}
        accent="teal"
        helperText="+10%"
      />
      <StatsCard
        title="Guardrails IA"
        value={stats.guardrailAlerts}
        icon={Activity}
        accent="danger"
        helperText="Alertas"
      />
    </section>
  )
}
