import type { RethusVerificationAction } from '@/types'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface VerificationModalProps {
  action: RethusVerificationAction
  doctorName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: { notes: string, evidenceUrl?: string }) => Promise<void>
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  }
  catch {
    return false
  }
}

export function VerificationModal({
  action,
  doctorName,
  isOpen,
  onClose,
  onConfirm,
}: VerificationModalProps) {
  const [notes, setNotes] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setNotes('')
      setEvidenceUrl('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const actionLabel = useMemo(() => {
    return action === 'APPROVE' ? 'Verificar' : 'Rechazar'
  }, [action])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedNotes = notes.trim()
    const trimmedEvidenceUrl = evidenceUrl.trim()

    if (!trimmedNotes) {
      setError('Las notas son obligatorias.')
      return
    }

    if (trimmedEvidenceUrl && !isValidUrl(trimmedEvidenceUrl)) {
      setError('El campo evidenceUrl debe ser una URL valida.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onConfirm({
        notes: trimmedNotes,
        evidenceUrl: trimmedEvidenceUrl || undefined,
      })
      onClose()
    }
    catch (submitError) {
      const message = submitError instanceof Error
        ? submitError.message
        : 'No se pudo procesar la solicitud.'
      setError(message)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {actionLabel}
          {' '}
          medico
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Confirma la accion para
          {' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{doctorName}</span>
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes *</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-slate-100"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              placeholder="Describe la razon de esta decision"
              disabled={isSubmitting}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Evidence URL (opcional)</span>
            <Input
              type="url"
              value={evidenceUrl}
              onChange={event => setEvidenceUrl(event.target.value)}
              placeholder="https://evidencia.com/soporte"
              disabled={isSubmitting}
            />
          </label>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant={action === 'APPROVE' ? 'default' : 'destructive'} disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : actionLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
