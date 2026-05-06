'use client'

import { Sparkles } from 'lucide-react'

interface Props {
  summary?: string
  isGenerating: boolean
  onGenerate: () => void
  disabled?: boolean
  triage?: {
    answers?: { questionText: string, answerValue: unknown }[]
    analysis?: {
      priority: string
      redFlags?: { severity: string, evidence: string }[]
    }
  } | null
}

export function ClinicalSummaryPanel({ summary, isGenerating, onGenerate, disabled, triage }: Props) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {triage?.analysis && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-bold text-slate-900">Datos del triage</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Prioridad:</span>
              <span className="text-xs font-bold text-slate-900">{triage.analysis.priority}</span>
            </div>
            {triage.analysis.redFlags?.length
              ? (
                <div>
                  <p className="mb-1 text-xs text-red-600 font-semibold">Señales de alarma:</p>
                  {triage.analysis.redFlags.map((rf, i) => (
                    <p key={i} className="text-xs text-red-700">
                      •
                      {rf.evidence}
                    </p>
                  ))}
                </div>
              )
              : null}
          </div>
          {triage.answers?.length
            ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
                  Ver respuestas del triage (
                  {triage.answers.length}
                  )
                </summary>
                <div className="mt-2 space-y-2">
                  {triage.answers.map((a, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-2">
                      <p className="text-xs text-slate-500">{a.questionText}</p>
                      <p className="text-xs font-semibold text-slate-900">{String(a.answerValue)}</p>
                    </div>
                  ))}
                </div>
              </details>
            )
            : null}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Resumen clínico IA</h4>
          <button
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-teal-500 to-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? 'Generando...' : 'Generar con IA'}
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="h-3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 animate-pulse rounded bg-slate-100 w-4/5" />
            <div className="h-3 animate-pulse rounded bg-slate-100 w-3/5" />
            <div className="h-3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 animate-pulse rounded bg-slate-100 w-2/3" />
          </div>
        )}

        {!isGenerating && summary && (
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{summary}</p>
        )}

        {!isGenerating && !summary && (
          <p className="text-xs text-slate-400">
            Haz clic en "Generar con IA" para obtener un resumen pre-consulta basado en las respuestas del triage.
          </p>
        )}
      </div>
    </div>
  )
}
