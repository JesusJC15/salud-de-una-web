import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionModuleCardProps {
  actionLabel: string
  description: string
  icon: LucideIcon
  title: string
}

export function ActionModuleCard({ actionLabel, description, icon: Icon, title }: ActionModuleCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-smooth hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900">
      <div className="grid min-h-32 place-items-center bg-teal-50 dark:bg-teal-900/20">
        <Icon className="h-7 w-7 text-teal-500" />
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <Button type="button" variant="secondary" className="h-10 w-full rounded-xl font-bold">
          {actionLabel}
        </Button>
      </div>
    </article>
  )
}
