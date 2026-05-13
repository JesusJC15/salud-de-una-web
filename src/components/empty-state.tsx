'use client'

import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface Props {
  action?: React.ReactNode
  description?: string
  icon?: LucideIcon
  title: string
}

export function EmptyState({ action, description, icon: Icon = Inbox, title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="rounded-full bg-slate-50 p-3 text-slate-300">
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
