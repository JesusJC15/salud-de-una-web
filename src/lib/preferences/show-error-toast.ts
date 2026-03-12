import toast from 'react-hot-toast'

export function showErrorToast(error: unknown, options?: { message?: string }) {
  const e = error instanceof Error ? error : new Error(String(error))
  const message = options?.message || e.message || 'Error inesperado'
  toast.error(message)
}
