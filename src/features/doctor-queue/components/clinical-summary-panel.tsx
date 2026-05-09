'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'

interface Props {
  consultationId: string
  summary?: string
  citations?: Array<{
    chunkId: string
    documentId: string
    title: string
    sectionPath: string | null
    authority: string
    snippet: string | null
    score: number
  }>
  isGenerating: boolean
  onGenerate: () => void
  onFeedback: (input: {
    value: 'USEFUL' | 'PARTIALLY_USEFUL' | 'NOT_USEFUL'
    comment?: string
  }) => void
  feedbackValue?: 'USEFUL' | 'PARTIALLY_USEFUL' | 'NOT_USEFUL' | null
  disabled?: boolean
  triage?: {
    answers?: { questionText: string, answerValue: unknown }[]
    analysis?: {
      priority: string
      redFlags?: { severity: string, evidence: string }[]
    }
  } | null
}

export function ClinicalSummaryPanel({
  summary,
  citations,
  isGenerating,
  onGenerate,
  onFeedback,
  feedbackValue,
  disabled,
  triage,
}: Props) {
  const [comment, setComment] = useState('')

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
                  {triage.analysis.redFlags.map(rf => (
                    <p key={rf.evidence} className="text-xs text-red-700">
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
                  {triage.answers.map(a => (
                    <div key={a.questionText} className="rounded-lg bg-slate-50 p-2">
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
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{summary}</p>
            {citations?.length
              ? (
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-700">
                    Evidencia citada
                  </p>
                  <div className="space-y-2">
                    {citations.map(citation => (
                      <div key={citation.chunkId} className="rounded-lg border border-cyan-100 bg-white p-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{citation.title}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {citation.authority}
                          </span>
                          {citation.sectionPath
                            ? <span className="text-[11px] text-slate-500">{citation.sectionPath}</span>
                            : null}
                        </div>
                        {citation.snippet
                          ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{citation.snippet}</p>
                          : null}
                      </div>
                    ))}
                  </div>
                </div>
              )
              : null}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Feedback médico</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Útil', value: 'USEFUL' },
                  { label: 'Parcial', value: 'PARTIALLY_USEFUL' },
                  { label: 'No útil', value: 'NOT_USEFUL' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => onFeedback({ value: option.value as Props['feedbackValue'] extends infer T ? Extract<T, string> : never, comment: comment || undefined })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      feedbackValue === option.value
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Comentario opcional"
                className="mt-3 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-hidden focus:border-teal-400"
              />
            </div>
          </div>
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
