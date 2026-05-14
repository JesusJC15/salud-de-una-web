import toast from 'react-hot-toast'
import { ApiClientError } from '@/api/api-client'

export function showErrorToast(error: unknown, options?: { message?: string }) {
  if (error instanceof ApiClientError && error.status === 429) {
    toast(error.message, { icon: '⏳', duration: 8_000 })
    return
  }
  const e = error instanceof Error ? error : new Error(String(error))
  const message = options?.message || e.message || 'Error inesperado'
  toast.error(message)
}
