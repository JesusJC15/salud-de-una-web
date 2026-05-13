'use client'

import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { ApiClientError } from '@/api/api-client'

interface Props {
  actionLabel?: string
  className?: string
  error?: unknown
  message?: string
  onRetry?: () => void
  title?: string
}

function getErrorDetails(error: unknown) {
  if (error instanceof ApiClientError) {
    return {
      correlationId: error.correlationId,
      message: error.message,
      status: error.status,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  return {}
}

export function ApiErrorState({
  actionLabel = 'Reintentar',
  className = '',
  error,
  message,
  onRetry,
  title = 'No se pudo cargar la información',
}: Props) {
  const details = getErrorDetails(error)
  const displayMessage = message ?? details.message ?? 'Verifica tu conexión o intenta de nuevo.'

  return (
    <div className={`rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-white p-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-red-800">{title}</p>
          <p className="mt-1 text-red-700">{displayMessage}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-red-700/80">
            {details.status
              ? (
                <span>
                  HTTP
                  {details.status}
                </span>
              )
              : null}
            {details.correlationId
              ? (
                <span>
                  Correlation ID:
                  {details.correlationId}
                </span>
              )
              : null}
          </div>
          {onRetry
            ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                {actionLabel}
              </button>
            )
            : null}
        </div>
      </div>
    </div>
  )
}
