'use client'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface ClientLogEvent {
  component?: string
  correlationId?: string
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
  path?: string
  status?: number
  userRole?: string
}

const SENSITIVE_KEY_PATTERN = /token|password|secret|email|content|message|summary|answer|chat|patient|doctor|fullName|firstName|lastName/i

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(sanitizeValue)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, current]) => {
        acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeValue(current)
        return acc
      },
      {},
    )
  }

  if (typeof value === 'string' && value.length > 240) {
    return `${value.slice(0, 240)}...`
  }

  return value
}

export function sanitizeLogMetadata(metadata?: Record<string, unknown>) {
  return metadata ? sanitizeValue(metadata) as Record<string, unknown> : undefined
}

export const clientLogger = {
  async log(event: ClientLogEvent) {
    if (typeof window === 'undefined')
      return

    const payload = {
      ...event,
      metadata: sanitizeLogMetadata(event.metadata),
      path: event.path ?? window.location.pathname,
    }

    try {
      await fetch('/api/client-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    }
    catch {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[clientLogger] failed to send event')
      }
    }
  },

  error(message: string, details?: Omit<ClientLogEvent, 'level' | 'message'>) {
    return this.log({ ...details, level: 'error', message })
  },

  warn(message: string, details?: Omit<ClientLogEvent, 'level' | 'message'>) {
    return this.log({ ...details, level: 'warn', message })
  },
}
