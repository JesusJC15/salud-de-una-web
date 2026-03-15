import { BarChart3, ClipboardCheck, FileCheck2, SlidersHorizontal } from 'lucide-react'
import { ActionModuleCard } from './action-module-card'

const moduleCards = [
  {
    title: 'Validacion Profesional',
    description: 'Revision manual de certificados y registros',
    actionLabel: 'Gestionar Pendientes',
    icon: ClipboardCheck,
  },
  {
    title: 'Configuracion de Triage',
    description: 'Gestion de Red Flags y logica clinica para Medicina y Odontologia',
    actionLabel: 'Editar Reglas',
    icon: SlidersHorizontal,
  },
  {
    title: 'Gestion de Contenido',
    description: 'Curaduria del banco de conocimientos clinicos',
    actionLabel: 'Aprobar Articulos',
    icon: FileCheck2,
  },
  {
    title: 'Panel Observabilidad',
    description: 'Visualizacion de KPIs tecnicos y de IA',
    actionLabel: 'Ver Dashboards',
    icon: BarChart3,
  },
] as const

export function ActionModulesGrid() {
  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
        Modulos de Gestion Critica
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map(card => (
          <ActionModuleCard
            key={card.title}
            title={card.title}
            description={card.description}
            actionLabel={card.actionLabel}
            icon={card.icon}
          />
        ))}
      </div>
    </section>
  )
}
