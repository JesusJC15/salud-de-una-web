'use client'

import { useState } from 'react'
import type { AiPromptItem } from '@/types/admin'
import { useAdminAiPrompts } from '../hooks/use-admin-ai-prompts'

export default function AdminAiPromptsPage() {
  const [page] = useState(1)
  const { prompts, total, isLoading, isError, refetch, createVersionMutation, toggleActiveMutation } =
    useAdminAiPrompts(page)

  const [editingPrompt, setEditingPrompt] = useState<AiPromptItem | null>(null)
  const [newInstruction, setNewInstruction] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

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
    if (!editingPrompt) return
    try {
      await createVersionMutation.mutateAsync({
        key: editingPrompt.key,
        systemInstruction: newInstruction,
      })
      closeEdit()
    } catch {
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
        {[1, 2, 3].map((i) => (
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
          className="mt-2 rounded bg-slate-800 px-4 py-2 text-sm text-white"
          onClick={() => void refetch()}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Prompts de IA</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} prompts registrados. Solo puede haber una versión activa por key.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Versión</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3">Actualizado</th>
              <th className="px-4 py-3">Acciones</th>
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
              prompts.map((prompt) => (
                <tr key={prompt._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-800">{prompt.key}</td>
                  <td className="px-4 py-3 text-slate-600">v{prompt.version}</td>
                  <td className="px-4 py-3 text-slate-500">{prompt.model}</td>
                  <td className="px-4 py-3">
                    <button
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
                  <td className="px-4 py-3 text-slate-400">
                    {prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
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

      {editingPrompt ? (
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              rows={12}
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
            />

            {saveError ? (
              <p className="mt-2 text-xs text-red-600">{saveError}</p>
            ) : null}

            <div className="mt-4 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={closeEdit}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-60"
                disabled={createVersionMutation.isPending || newInstruction.trim().length < 10}
                onClick={() => void handleSaveNewVersion()}
              >
                {createVersionMutation.isPending ? 'Guardando...' : 'Guardar nueva versión'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
