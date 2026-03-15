import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  accent?: 'warning' | 'success' | 'teal' | 'danger'
  helperText?: string
}

const accentClassMap: Record<NonNullable<StatsCardProps['accent']>, string> = {
  warning: 'text-amber-500',
  success: 'text-emerald-500',
  teal: 'text-teal-500',
  danger: 'text-red-500',
}

export function StatsCard({ title, value, icon: Icon, accent = 'teal', helperText }: StatsCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
        <Icon className={cn('h-5 w-5', accentClassMap[accent])} />
      </div>

      <div className="flex items-end gap-2">
        <p className="text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {helperText ? <p className={cn('pb-1 text-xs font-bold uppercase', accentClassMap[accent])}>{helperText}</p> : null}
      </div>
    </article>
  )
}
