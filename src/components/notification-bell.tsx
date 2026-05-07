'use client'

import { Bell, CheckCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '@/features/notifications/hooks/use-notifications'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr)
    return ''
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000)
  if (mins < 1)
    return 'ahora'
  if (mins < 60)
    return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)
    return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data, markRead, markAllRead, isMarkingAll } = useNotifications()

  const items = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-600"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-100 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-black text-slate-900">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50 disabled:opacity-50"
                  title="Marcar todo como leído"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Todo leído
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0
              ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell className="h-8 w-8 text-slate-200" />
                  <p className="text-xs text-slate-400">Sin notificaciones nuevas</p>
                </div>
              )
              : items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.read) {
                      markRead(item.id)
                    }
                  }}
                  className={`w-full border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 ${!item.read ? 'bg-teal-50/40' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!item.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    )}
                    <div className={!item.read ? '' : 'pl-4'}>
                      <p className="text-xs font-medium text-slate-700">{item.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
