export interface BackendErrorPayload {
  correlation_id?: string
  message?: string | string[]
  path?: string
  statusCode?: number
  timestamp?: string
}

export interface TimeoutController {
  cleanup: () => void
  didTimeout: () => boolean
  signal?: AbortSignal
}

export function createCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function createTimeoutController(
  timeoutMs: number,
  externalSignal?: AbortSignal,
): TimeoutController {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return {
      cleanup: () => {},
      didTimeout: () => false,
      signal: externalSignal,
    }
  }

  const controller = new AbortController()
  let timedOut = false

  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const onAbort = () => {
    controller.abort()
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    }
    else {
      externalSignal.addEventListener('abort', onAbort, { once: true })
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId)
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onAbort)
      }
    },
  }
}
