'use client'

import type { AiPromptItem } from '@/types/admin'
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { adminService } from '@/features/admin-console/services/admin-service'
import { useAdminAiPrompts } from '../hooks/use-admin-ai-prompts'

type AiHealthResult = Awaited<ReturnType<typeof adminService.checkAiHealth>>

function AiHealthBadge({ result }: { result: AiHealthResult }) {
  const isUp = result.status === 'up' && !result.degraded
  const isDisabled = result.status === 'disabled'

  const cfg = isDisabled
    ? { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: Zap, label: 'IA deshabilitada' }
    : isUp
      ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, label: 'IA operativa' }
      : { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle, label: result.status === 'down' ? 'IA caída' : 'IA degradada' }

  const Icon = cfg.icon

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.text}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {result.provider}
            {' · '}
            {result.model}
            {' · '}
            {result.latencyMs}
            ms
          </p>
          {result.error && (
            <p className="mt-1 text-xs text-red-600">{result.error}</p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            Verificado:
            {' '}
            {new Date(result.checkedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminAiPromptsPage() {
  const [page] = useState(1)
  const { prompts, total, isLoading, isError, refetch, createVersionMutation, toggleActiveMutation }
    = useAdminAiPrompts(page)

  const [editingPrompt, setEditingPrompt] = useState<AiPromptItem | null>(null)
  const [newInstruction, setNewInstruction] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [healthResult, setHealthResult] = useState<AiHealthResult | null>(null)
  const [healthChecking, setHealthChecking] = useState(false)

  async function handleHealthCheck() {
    setHealthChecking(true)
    try {
      const result = await adminService.checkAiHealth()
      setHealthResult(result)
      if (result.status === 'up' && !result.degraded) {
        toast.success(`IA operativa — ${result.latencyMs}ms`)
      }
      else {
        toast.error(result.error ?? `IA en estado: ${result.status}`)
      }
    }
    catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo verificar la IA')
    }
    finally {
      setHealthChecking(false)
    }
  }

  function openEdit(prompt: AiPromptItem) {
    setEditingPrompt(prompt)
    setNewInstruction(prompt.systemInstruction)
    setSaveError(null)
  }

  function closeEdit() {
    setEditingPrompt(null)
    setNewInstruction('')
    setSaveError(null)
  }

  async function handleSaveNewVersion() {
    if (!editingPrompt)
      return
    try {
      await createVersionMutation.mutateAsync({
        key: editingPrompt.key,
        systemInstruction: newInstruction,
      })
      closeEdit()
    }
    catch {
      setSaveError('No se pudo guardar la nueva versión. Intenta de nuevo.')
    }
  }

  async function handleToggle(prompt: AiPromptItem) {
    await toggleActiveMutation.mutateAsync({ id: prompt._id, active: !prompt.active })
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        {[
          1,
          2,
          3,
        ].map(i => (
          <div key={i} className="h-16 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error al cargar los prompts.</p>
        <button
          type="button"
          className="mt-2 rounded bg-slate-800 px-4 py-2 text-sm text-white"
          onClick={() => void refetch()}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Constructor de Prompts de IA</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total}
            {' '}
            prompts registrados. Solo puede haber una versión activa por key.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <button
            type="button"
            onClick={() => void handleHealthCheck()}
            disabled={healthChecking}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-700 disabled:opacity-60"
          >
            {healthChecking
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Activity className="h-4 w-4" />}
            {healthChecking ? 'Verificando...' : 'Verificar conectividad IA'}
          </button>
        </div>
      </div>

      {/* ── Health result ── */}
      {healthResult && <AiHealthBadge result={healthResult} />}

      {/* ── Prompts table ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Agregamos border-separate y border-spacing-0 para asegurar el funcionamiento de sticky */}
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 border-b border-slate-100">Key</th>
              <th className="px-4 py-3 border-b border-slate-100">Versión</th>
              <th className="px-4 py-3 border-b border-slate-100">Modelo</th>
              <th className="px-4 py-3 border-b border-slate-100">Activo</th>
              <th className="px-4 py-3 border-b border-slate-100">Actualizado</th>
              {/* Columna Acciones Fija */}
              <th className="sticky right-0 z-10 bg-slate-50 px-4 py-3 border-b border-slate-100 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prompts.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                  No hay prompts registrados. Se sembrarán al reiniciar el backend.
                </td>
              </tr>
            ) : (
              prompts.map(prompt => (
                <tr key={prompt._id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-800 border-b border-slate-50">
                    {prompt.key}
                  </td>
                  <td className="px-4 py-3 text-slate-600 border-b border-slate-50">
                    v
                    {prompt.version}
                  </td>
                  <td className="px-4 py-3 text-slate-500 border-b border-slate-50">
                    {prompt.model}
                  </td>
                  <td className="px-4 py-3 border-b border-slate-50">
                    <button
                      type="button"
                      aria-label={prompt.active ? 'Desactivar prompt' : 'Activar prompt'}
                      className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors ${
                        prompt.active ? 'bg-teal-500' : 'bg-slate-300'
                      }`}
                      disabled={toggleActiveMutation.isPending}
                      onClick={() => void handleToggle(prompt)}
                    >
                      <span
                        className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                          prompt.active ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400 border-b border-slate-50">
                    {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleDateString('es-CO') : '—'}
                  </td>
                  {/* Celda de Acciones Fija */}
                  <td className="sticky right-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50 transition-colors border-b border-slate-50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    <button
                      type="button"
                      className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700"
                      onClick={() => openEdit(prompt)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Edit modal ── */}
      {editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Editar prompt</h2>
            <p className="mb-1 font-mono text-xs text-slate-500">{editingPrompt.key}</p>
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Guardar crea una nueva versión. La versión anterior quedará inactiva.
            </p>

            <label className="mb-1 block text-xs font-semibold text-slate-700">
              System instruction
            </label>
            <textarea
              id="prompt-instruction"
              aria-label="System instruction del prompt"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              rows={12}
              value={newInstruction}
              onChange={e => setNewInstruction(e.target.value)}
            />

            {saveError && (
              <p className="mt-2 text-xs text-red-600">{saveError}</p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={closeEdit}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-60"
                disabled={createVersionMutation.isPending || newInstruction.trim().length < 10}
                onClick={() => void handleSaveNewVersion()}
              >
                {createVersionMutation.isPending ? 'Guardando...' : 'Guardar nueva versión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
