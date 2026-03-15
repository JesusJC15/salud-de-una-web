import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActivityFeedItem {
  id: string
  icon: LucideIcon
  message: string
  statusLabel?: string
  statusTone?: 'default' | 'danger'
  timestamp: string
}

interface ActivityItemProps {
  item: ActivityFeedItem
}

export function ActivityItem({ item }: ActivityItemProps) {
  const Icon = item.icon

  return (
    <article className="flex items-start justify-between gap-3 border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.message}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.timestamp}</p>
        </div>
      </div>

      {item.statusLabel
        ? (
          <span className={cn('rounded-full px-2 py-1 text-xs font-bold uppercase', item.statusTone === 'danger'
            ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300')}
          >
            {item.statusLabel}
          </span>
        )
        : null}
    </article>
  )
}
