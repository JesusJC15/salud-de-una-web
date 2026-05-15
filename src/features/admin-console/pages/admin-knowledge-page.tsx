'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CheckCircle2, DatabaseZap, RefreshCw, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminService } from '@/features/admin-console/services/admin-service'
import {
  knowledgeFileDocumentSchema,
  knowledgeSourceSchema,
  knowledgeTextDocumentSchema,
  knowledgeUrlDocumentSchema,
} from '@/features/admin-console/validators/knowledge-schemas'

const SOURCE_TYPE_OPTIONS = [
  'Guía clínica',
  'Normativa',
  'Protocolo',
  'Preguntas frecuentes',
  'Literatura científica',
  'Medicamento',
  'Triage',
  'Ruta clínica',
] as const

const SPECIALTY_OPTIONS = [
  'Medicina general',
  'Urgencias',
  'Odontología',
] as const

type SourceTypeLabel = (typeof SOURCE_TYPE_OPTIONS)[number]
type SpecialtyLabel = (typeof SPECIALTY_OPTIONS)[number]

const SOURCE_TYPE_TO_BACKEND: Record<SourceTypeLabel, string> = {
  'Guía clínica': 'GUIDELINE',
  'Normativa': 'REGULATION',
  'Protocolo': 'PROTOCOL',
  'Preguntas frecuentes': 'FAQ',
  'Literatura científica': 'LITERATURE',
  'Medicamento': 'MEDICATION',
  'Triage': 'TRIAGE',
  'Ruta clínica': 'ROUTE',
}

const BACKEND_TO_SOURCE_TYPE = Object.fromEntries(
  Object.entries(SOURCE_TYPE_TO_BACKEND).map(([label, value]) => [value, label]),
)

const SPECIALTY_TO_BACKEND: Record<SpecialtyLabel, string> = {
  'Medicina general': 'GENERAL_MEDICINE',
  'Urgencias': 'URGENT_CARE',
  'Odontología': 'ODONTOLOGY',
}

const BACKEND_TO_SPECIALTY = Object.fromEntries(
  Object.entries(SPECIALTY_TO_BACKEND).map(([label, value]) => [value, label]),
)

function toBackendSourceType(sourceType: string) {
  return SOURCE_TYPE_TO_BACKEND[sourceType as SourceTypeLabel] ?? sourceType
}

function toBackendSpecialty(specialty: string) {
  return SPECIALTY_TO_BACKEND[specialty as SpecialtyLabel] ?? specialty
}

interface KnowledgeSourceForm {
  name: string
  authority: string
  sourceType: SourceTypeLabel
  baseUrl: string
  country: string
  notes: string
}

interface KnowledgeDocumentBaseForm {
  title: string
  authority: string
  sourceType: SourceTypeLabel
  specialty: SpecialtyLabel
  audience: string
  useCases: string
  country: string
  clinicalTags: string
  symptoms: string
  redFlags: string
  drugNames: string
}

interface KnowledgeTextDocumentForm extends KnowledgeDocumentBaseForm {
  contentText: string
}

interface KnowledgeFileDocumentForm extends KnowledgeDocumentBaseForm {
  file: File | null
}

interface KnowledgeUrlForm extends KnowledgeDocumentBaseForm {
  sourceUrl: string
}

function translateSourceType(sourceType: string | undefined) {
  if (!sourceType)
    return ''
  return BACKEND_TO_SOURCE_TYPE[sourceType] ?? sourceType
}

function translateAdminSpecialty(specialty: string | undefined) {
  if (!specialty)
    return ''
  return BACKEND_TO_SPECIALTY[specialty] ?? specialty
}

function toBackendSourceForm(form: KnowledgeSourceForm) {
  return {
    ...form,
    sourceType: toBackendSourceType(form.sourceType),
  }
}

function toBackendDocumentForm<Form extends KnowledgeDocumentBaseForm>(form: Form) {
  return {
    ...form,
    sourceType: toBackendSourceType(form.sourceType),
    specialty: toBackendSpecialty(form.specialty),
  }
}

export function AdminKnowledgePage() {
  const queryClient = useQueryClient()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [fileForm, setFileForm] = useState<KnowledgeFileDocumentForm>({
    title: '',
    authority: '',
    sourceType: 'Guía clínica',
    specialty: 'Medicina general',
    audience: 'STAFF',
    useCases: 'CLINICAL_SUMMARY,TRIAGE',
    country: 'CO',
    clinicalTags: '',
    symptoms: '',
    redFlags: '',
    drugNames: '',
    file: null as File | null,
  })
  const [sourceForm, setSourceForm] = useState<KnowledgeSourceForm>({
    name: '',
    authority: '',
    sourceType: 'Guía clínica',
    baseUrl: '',
    country: 'CO',
    notes: '',
  })
  const [textForm, setTextForm] = useState<KnowledgeTextDocumentForm>({
    title: '',
    authority: '',
    sourceType: 'Guía clínica',
    specialty: 'Medicina general',
    audience: 'STAFF',
    useCases: 'CLINICAL_SUMMARY,TRIAGE',
    country: 'CO',
    clinicalTags: '',
    symptoms: '',
    redFlags: '',
    drugNames: '',
    contentText: '',
  })
  const [urlForm, setUrlForm] = useState<KnowledgeUrlForm>({
    title: '',
    authority: '',
    sourceType: 'Guía clínica',
    specialty: 'Medicina general',
    sourceUrl: '',
    audience: 'STAFF',
    useCases: 'CLINICAL_SUMMARY',
    country: 'CO',
    clinicalTags: '',
    symptoms: '',
    redFlags: '',
    drugNames: '',
  })

  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({})
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [textErrors, setTextErrors] = useState<Record<string, string>>({})
  const [urlErrors, setUrlErrors] = useState<Record<string, string>>({})

  function extractFieldErrors(result: { success: boolean, error?: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }): Record<string, string> {
    if (result.success || !result.error)
      return {}
    return Object.fromEntries(
      Object.entries(result.error.flatten().fieldErrors)
        .map(([k, v]) => [k, Array.isArray(v) ? (v[0] ?? '') : '']),
    )
  }

  const sourcesQuery = useQuery({
    queryKey: [
      'admin',
      'knowledge',
      'sources',
    ],
    queryFn: () => adminService.listKnowledgeSources(),
    staleTime: 30_000,
  })

  const documentsQuery = useQuery({
    queryKey: [
      'admin',
      'knowledge',
      'documents',
    ],
    queryFn: () => adminService.listKnowledgeDocuments(),
    staleTime: 20_000,
  })

  const jobsQuery = useQuery({
    queryKey: [
      'admin',
      'knowledge',
      'jobs',
    ],
    queryFn: () => adminService.listKnowledgeJobs(),
    staleTime: 20_000,
    refetchInterval: 30_000,
  })

  const ragMetricsQuery = useQuery({
    queryKey: [
      'admin',
      'knowledge',
      'rag-metrics',
    ],
    queryFn: () => adminService.getRagMetrics(),
    staleTime: 20_000,
    refetchInterval: 30_000,
  })

  const ragTracesQuery = useQuery({
    queryKey: [
      'admin',
      'knowledge',
      'rag-traces',
    ],
    queryFn: () => adminService.getRagTraces(12),
    staleTime: 20_000,
    refetchInterval: 30_000,
  })

  const chunksQuery = useQuery({
    queryKey: [
      'admin',
      'knowledge',
      'chunks',
      selectedDocumentId,
    ],
    queryFn: () => adminService.getKnowledgeChunks(selectedDocumentId!),
    enabled: !!selectedDocumentId,
    staleTime: 20_000,
  })

  const invalidateKnowledge = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'knowledge',
          'sources',
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'knowledge',
          'documents',
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'knowledge',
          'jobs',
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'knowledge',
          'rag-metrics',
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'knowledge',
          'rag-traces',
        ],
      }),
      queryClient.invalidateQueries({ queryKey: ['doctor', 'consultation'] }),
    ])
  }

  const createSourceMutation = useMutation({
    mutationFn: () => {
      const backendForm = toBackendSourceForm(sourceForm)
      return adminService.createKnowledgeSource(knowledgeSourceSchema.parse(backendForm))
    },
    onSuccess: async () => {
      toast.success('Fuente creada')
      setSourceForm({
        name: '',
        authority: '',
        sourceType: 'Guía clínica',
        baseUrl: '',
        country: 'CO',
        notes: '',
      })
      await invalidateKnowledge()
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No fue posible crear la fuente'),
  })

  const createTextDocumentMutation = useMutation({
    mutationFn: () => {
      const backendForm = toBackendDocumentForm(textForm)
      return adminService.createKnowledgeTextDocument(knowledgeTextDocumentSchema.parse(backendForm))
    },
    onSuccess: async () => {
      toast.success('Documento enviado a ingesta')
      setTextForm({
        title: '',
        authority: '',
        sourceType: 'Guía clínica',
        specialty: 'Medicina general',
        audience: 'STAFF',
        useCases: 'CLINICAL_SUMMARY,TRIAGE',
        country: 'CO',
        clinicalTags: '',
        symptoms: '',
        redFlags: '',
        drugNames: '',
        contentText: '',
      })
      await invalidateKnowledge()
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No fue posible crear el documento textual'),
  })

  const uploadFileDocumentMutation = useMutation({
    mutationFn: () => {
      const backendForm = {
        ...toBackendDocumentForm(fileForm),
        file: fileForm.file,
      }
      return adminService.uploadKnowledgeFileDocument(knowledgeFileDocumentSchema.parse(backendForm))
    },
    onSuccess: async () => {
      toast.success('Archivo enviado a ingesta')
      setFileForm({
        title: '',
        authority: '',
        sourceType: 'Guía clínica',
        specialty: 'Medicina general',
        audience: 'STAFF',
        useCases: 'CLINICAL_SUMMARY,TRIAGE',
        country: 'CO',
        clinicalTags: '',
        symptoms: '',
        redFlags: '',
        drugNames: '',
        file: null,
      })
      await invalidateKnowledge()
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No fue posible cargar el archivo'),
  })

  const ingestUrlMutation = useMutation({
    mutationFn: () => {
      const backendForm = toBackendDocumentForm(urlForm)
      return adminService.ingestKnowledgeUrl(knowledgeUrlDocumentSchema.parse(backendForm))
    },
    onSuccess: async () => {
      toast.success('Documento por URL enviado a ingesta')
      setUrlForm({
        title: '',
        authority: '',
        sourceType: 'Guía clínica',
        specialty: 'Medicina general',
        sourceUrl: '',
        audience: 'STAFF',
        useCases: 'CLINICAL_SUMMARY',
        country: 'CO',
        clinicalTags: '',
        symptoms: '',
        redFlags: '',
        drugNames: '',
      })
      await invalidateKnowledge()
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No fue posible ingerir la URL'),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ documentId, status }: { documentId: string, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' }) =>
      adminService.reviewKnowledgeDocument(documentId, { status }),
    onSuccess: async () => {
      toast.success('Estado actualizado')
      await invalidateKnowledge()
    },
    onError: () => toast.error('No fue posible actualizar la revisión'),
  })

  const reprocessMutation = useMutation({
    mutationFn: (documentId: string) => adminService.reprocessKnowledgeDocument(documentId),
    onSuccess: async () => {
      toast.success('Documento reprocesado')
      await invalidateKnowledge()
    },
    onError: () => toast.error('No fue posible reprocesar el documento'),
  })

  const documents = useMemo(() => documentsQuery.data?.items ?? [], [documentsQuery.data?.items])
  const selectedDocument = useMemo(
    () => documents.find(document => document.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  )

  return (
    <div className="min-h-screen bg-[#f5fbfb] px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-manrope text-2xl font-black tracking-tight text-slate-900">
              Knowledge & RAG Console
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gobierno clínico, corpus aprobado y trazabilidad de recuperación.
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
              onClick={() => void invalidateKnowledge()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refrescar
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Documentos aprobados',
              value: ragMetricsQuery.data?.corpus.approvedDocuments ?? 0,
              sub: `de ${ragMetricsQuery.data?.corpus.totalDocuments ?? 0} documentos`,
              icon: CheckCircle2,
              accent: 'bg-emerald-50 text-emerald-700',
            },
            {
              label: 'Pendientes de revisión',
              value: ragMetricsQuery.data?.corpus.pendingReview ?? 0,
              sub: 'cola clínica actual',
              icon: ShieldAlert,
              accent: 'bg-amber-50 text-amber-700',
            },
            {
              label: 'Retrieval grounded',
              value: `${ragMetricsQuery.data?.retrieval.groundedRate ?? 0}%`,
              sub: `fallback ${ragMetricsQuery.data?.retrieval.fallbackRate ?? 0}%`,
              icon: DatabaseZap,
              accent: 'bg-cyan-50 text-cyan-700',
            },
            {
              label: 'Latencia promedio',
              value: `${ragMetricsQuery.data?.retrieval.avgLatencyMs ?? 0} ms`,
              sub: `zero-hit ${ragMetricsQuery.data?.retrieval.zeroHitRate ?? 0}%`,
              icon: AlertTriangle,
              accent: 'bg-slate-100 text-slate-700',
            },
          ].map(item => (
            <div key={item.label} className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl px-3 py-2 ${item.accent}`}>
                  <item.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <h2 className="text-base font-black text-slate-900">Nueva fuente</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={sourceForm.name} onChange={event => setSourceForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Nombre de la fuente" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={sourceForm.authority} onChange={event => setSourceForm(prev => ({ ...prev, authority: event.target.value }))} placeholder="Autoridad" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select aria-label="Tipo de fuente" value={sourceForm.sourceType} onChange={event => setSourceForm(prev => ({ ...prev, sourceType: event.target.value as SourceTypeLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SOURCE_TYPE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <input value={sourceForm.baseUrl} onChange={event => setSourceForm(prev => ({ ...prev, baseUrl: event.target.value }))} placeholder="Base URL (opcional)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={sourceForm.country} onChange={event => setSourceForm(prev => ({ ...prev, country: event.target.value }))} placeholder="País" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={sourceForm.notes} onChange={event => setSourceForm(prev => ({ ...prev, notes: event.target.value }))} placeholder="Notas" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              {Object.keys(sourceErrors).length > 0 && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3">
                  <p className="mb-1 text-xs font-bold text-red-700">Corregí los siguientes campos:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {Object.values(sourceErrors).map((msg, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={i} className="text-xs text-red-600">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const backendForm = toBackendSourceForm(sourceForm)
                  const result = knowledgeSourceSchema.safeParse(backendForm)
                  const errs = extractFieldErrors(result)
                  if (Object.keys(errs).length > 0) {
                    setSourceErrors(errs)
                    return
                  }
                  setSourceErrors({})
                  createSourceMutation.mutate()
                }}
                disabled={createSourceMutation.isPending}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Crear fuente
              </button>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <h2 className="text-base font-black text-slate-900">Upload de archivo</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={fileForm.title} onChange={event => setFileForm(prev => ({ ...prev, title: event.target.value }))} placeholder="Título" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={fileForm.authority} onChange={event => setFileForm(prev => ({ ...prev, authority: event.target.value }))} placeholder="Autoridad" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select aria-label="Tipo de fuente" value={fileForm.sourceType} onChange={event => setFileForm(prev => ({ ...prev, sourceType: event.target.value as SourceTypeLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SOURCE_TYPE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <select aria-label="Especialidad" value={fileForm.specialty} onChange={event => setFileForm(prev => ({ ...prev, specialty: event.target.value as SpecialtyLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SPECIALTY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <input value={fileForm.useCases} onChange={event => setFileForm(prev => ({ ...prev, useCases: event.target.value }))} placeholder="Use cases (coma)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={fileForm.country} onChange={event => setFileForm(prev => ({ ...prev, country: event.target.value }))} placeholder="País" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={fileForm.clinicalTags} onChange={event => setFileForm(prev => ({ ...prev, clinicalTags: event.target.value }))} placeholder="Tags clínicos" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={fileForm.symptoms} onChange={event => setFileForm(prev => ({ ...prev, symptoms: event.target.value }))} placeholder="Síntomas" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={fileForm.redFlags} onChange={event => setFileForm(prev => ({ ...prev, redFlags: event.target.value }))} placeholder="Red flags" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={fileForm.drugNames} onChange={event => setFileForm(prev => ({ ...prev, drugNames: event.target.value }))} placeholder="Medicamentos" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <label className="mt-3 flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 hover:border-teal-400 hover:bg-teal-50/40">
                <span className="font-semibold text-slate-700">
                  {fileForm.file ? fileForm.file.name : 'Seleccionar PDF, HTML, Markdown o TXT'}
                </span>
                <span className="text-xs text-slate-500">
                  Sprint 5 admite PDFs digitales con texto, HTML, Markdown y texto plano.
                </span>
                <input
                  type="file"
                  accept=".pdf,.html,.htm,.md,.markdown,.txt,.json,.csv,text/plain,text/html,application/pdf"
                  className="hidden"
                  onChange={event => setFileForm(prev => ({ ...prev, file: event.target.files?.[0] ?? null }))}
                />
              </label>
              {Object.keys(fileErrors).length > 0 && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3">
                  <p className="mb-1 text-xs font-bold text-red-700">Corregí los siguientes campos:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {Object.values(fileErrors).map((msg, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={i} className="text-xs text-red-600">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const backendForm = {
                    ...toBackendDocumentForm(fileForm),
                    file: fileForm.file,
                  }
                  const result = knowledgeFileDocumentSchema.safeParse(backendForm)
                  const errs = extractFieldErrors(result)
                  if (Object.keys(errs).length > 0) {
                    setFileErrors(errs)
                    return
                  }
                  setFileErrors({})
                  uploadFileDocumentMutation.mutate()
                }}
                disabled={uploadFileDocumentMutation.isPending}
                className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Subir archivo
              </button>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <h2 className="text-base font-black text-slate-900">Documento textual</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={textForm.title} onChange={event => setTextForm(prev => ({ ...prev, title: event.target.value }))} placeholder="Título" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={textForm.authority} onChange={event => setTextForm(prev => ({ ...prev, authority: event.target.value }))} placeholder="Autoridad" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select aria-label="Tipo de fuente" value={textForm.sourceType} onChange={event => setTextForm(prev => ({ ...prev, sourceType: event.target.value as SourceTypeLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SOURCE_TYPE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <select aria-label="Especialidad" value={textForm.specialty} onChange={event => setTextForm(prev => ({ ...prev, specialty: event.target.value as SpecialtyLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SPECIALTY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <input value={textForm.useCases} onChange={event => setTextForm(prev => ({ ...prev, useCases: event.target.value }))} placeholder="Use cases (coma)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={textForm.country} onChange={event => setTextForm(prev => ({ ...prev, country: event.target.value }))} placeholder="País" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={textForm.clinicalTags} onChange={event => setTextForm(prev => ({ ...prev, clinicalTags: event.target.value }))} placeholder="Tags clínicos" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={textForm.symptoms} onChange={event => setTextForm(prev => ({ ...prev, symptoms: event.target.value }))} placeholder="Síntomas" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={textForm.redFlags} onChange={event => setTextForm(prev => ({ ...prev, redFlags: event.target.value }))} placeholder="Red flags" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={textForm.drugNames} onChange={event => setTextForm(prev => ({ ...prev, drugNames: event.target.value }))} placeholder="Medicamentos" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <textarea value={textForm.contentText} onChange={event => setTextForm(prev => ({ ...prev, contentText: event.target.value }))} placeholder="Contenido clínico a indexar" className="mt-3 min-h-48 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              {Object.keys(textErrors).length > 0 && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3">
                  <p className="mb-1 text-xs font-bold text-red-700">Corregí los siguientes campos:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {Object.values(textErrors).map((msg, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={i} className="text-xs text-red-600">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const backendForm = toBackendDocumentForm(textForm)
                  const result = knowledgeTextDocumentSchema.safeParse(backendForm)
                  const errs = extractFieldErrors(result)
                  if (Object.keys(errs).length > 0) {
                    setTextErrors(errs)
                    return
                  }
                  setTextErrors({})
                  createTextDocumentMutation.mutate()
                }}
                disabled={createTextDocumentMutation.isPending}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Ingerir documento textual
              </button>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
              <h2 className="text-base font-black text-slate-900">Ingesta por URL</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={urlForm.title} onChange={event => setUrlForm(prev => ({ ...prev, title: event.target.value }))} placeholder="Título" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={urlForm.authority} onChange={event => setUrlForm(prev => ({ ...prev, authority: event.target.value }))} placeholder="Autoridad" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select aria-label="Tipo de fuente" value={urlForm.sourceType} onChange={event => setUrlForm(prev => ({ ...prev, sourceType: event.target.value as SourceTypeLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SOURCE_TYPE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <select aria-label="Especialidad" value={urlForm.specialty} onChange={event => setUrlForm(prev => ({ ...prev, specialty: event.target.value as SpecialtyLabel }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  {SPECIALTY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                <input value={urlForm.useCases} onChange={event => setUrlForm(prev => ({ ...prev, useCases: event.target.value }))} placeholder="Use cases (coma)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={urlForm.country} onChange={event => setUrlForm(prev => ({ ...prev, country: event.target.value }))} placeholder="País" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <input value={urlForm.sourceUrl} onChange={event => setUrlForm(prev => ({ ...prev, sourceUrl: event.target.value }))} placeholder="https://..." className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              {Object.keys(urlErrors).length > 0 && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3">
                  <p className="mb-1 text-xs font-bold text-red-700">Corregí los siguientes campos:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {Object.values(urlErrors).map((msg, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={i} className="text-xs text-red-600">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const backendForm = toBackendDocumentForm(urlForm)
                  const result = knowledgeUrlDocumentSchema.safeParse(backendForm)
                  const errs = extractFieldErrors(result)
                  if (Object.keys(errs).length > 0) {
                    setUrlErrors(errs)
                    return
                  }
                  setUrlErrors({})
                  ingestUrlMutation.mutate()
                }}
                disabled={ingestUrlMutation.isPending}
                className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                Ingerir URL
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 auto-rows-fr">
            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)] flex h-full flex-col min-h-[22rem]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Fuentes</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {sourcesQuery.data?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(sourcesQuery.data ?? []).map(source => (
                  <div key={source._id ?? source.name} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{source.name}</p>
                        <p className="text-xs text-slate-500">
                          {source.authority}
                          {' · '}
                          {translateSourceType(source.sourceType)}
                          {' · '}
                          {source.country}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${source.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {source.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)] flex h-full flex-col min-h-[22rem]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Documentos</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {documentsQuery.data?.total ?? 0}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {documents.map(document => (
                  <div key={document.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <button type="button" onClick={() => setSelectedDocumentId(document.id)} className="text-left text-sm font-black text-slate-900 hover:text-teal-700">
                          {document.title}
                        </button>
                        <p className="mt-1 text-xs text-slate-500">
                          {document.authority}
                          {' · '}
                          {translateAdminSpecialty(document.specialty)}
                          {' · '}
                          v
                          {document.currentVersion}
                        </p>
                        {document.ingestionError
                          ? <p className="mt-2 text-xs text-red-600">{document.ingestionError}</p>
                          : null}
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        document.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : document.status === 'READY_FOR_REVIEW'
                            ? 'bg-amber-100 text-amber-700'
                            : document.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-200 text-slate-700'
                      }`}
                      >
                        {document.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { label: 'Aprobar', status: 'APPROVED' as const, className: 'bg-emerald-600 hover:bg-emerald-700' },
                        { label: 'Rechazar', status: 'REJECTED' as const, className: 'bg-slate-700 hover:bg-slate-800' },
                        { label: 'Suspender', status: 'SUSPENDED' as const, className: 'bg-amber-600 hover:bg-amber-700' },
                      ].map(action => (
                        <button
                          key={action.status}
                          type="button"
                          onClick={() => reviewMutation.mutate({ documentId: document.id, status: action.status })}
                          disabled={reviewMutation.isPending}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 ${action.className}`}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => reprocessMutation.mutate(document.id)}
                        disabled={reprocessMutation.isPending}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Reprocesar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)] flex h-full flex-col min-h-[22rem]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Jobs recientes</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {jobsQuery.data?.total ?? 0}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {(jobsQuery.data?.items ?? []).slice(0, 8).map(job => (
                  <div key={job.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{job.type}</p>
                        <p className="text-xs text-slate-500">
                          {job.durationMs}
                          {' '}
                          ms
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : job.status === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    {job.errorMessage
                      ? <p className="mt-2 text-xs text-red-600">{job.errorMessage}</p>
                      : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)] flex h-full flex-col min-h-[22rem]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Trazas RAG</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {ragTracesQuery.data?.total ?? 0}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                {(ragTracesQuery.data?.items ?? []).map(trace => (
                  <div key={trace.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{trace.useCase}</p>
                        <p className="mt-1 text-xs text-slate-500">{trace.normalizedQuery}</p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          trace.grounded
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                        >
                          {trace.grounded ? 'GROUNDED' : 'UNGROUNDED'}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {trace.totalLatencyMs}
                          ms
                          {' · '}
                          {trace.cacheHit ? 'cache' : 'live'}
                        </p>
                      </div>
                    </div>
                    {trace.answer
                      ? <p className="mt-3 text-xs leading-relaxed text-slate-700">{trace.answer}</p>
                      : null}
                    <div className="mt-3 space-y-2">
                      {trace.selectedChunks.slice(0, 3).map(chunk => (
                        <div key={chunk.chunkId} className="rounded-xl border border-cyan-100 bg-white p-2.5">
                          <p className="text-xs font-bold text-slate-800">
                            {chunk.title}
                            {' · '}
                            {chunk.authority}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{chunk.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_24px_rgba(20,184,166,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Chunks</h2>
              {selectedDocument
                ? <span className="text-xs font-semibold text-slate-500">{selectedDocument.title}</span>
                : null}
            </div>
            {!selectedDocumentId
              ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  Selecciona un documento para inspeccionar sus chunks.
                </p>
              )
              : (
                <div className="space-y-3">
                  {(chunksQuery.data?.items ?? []).map(chunk => (
                    <div key={chunk.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">
                          Chunk #
                          {chunk.chunkIndex}
                          {' · '}
                          {chunk.sectionPath || 'General'}
                        </p>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {chunk.embeddingDimensions}
                          d
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">{chunk.text}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </section>
      </div>
    </div>
  )
}
