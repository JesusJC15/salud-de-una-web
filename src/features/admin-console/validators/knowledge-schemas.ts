import { z } from 'zod'

const sourceTypes = [
  'GUIDELINE',
  'REGULATION',
  'PROTOCOL',
  'FAQ',
  'LITERATURE',
  'MEDICATION',
  'TRIAGE',
  'ROUTE',
] as const
const specialties = [
  'GENERAL_MEDICINE',
  'URGENT_CARE',
  'ODONTOLOGY',
] as const
const audiences = [
  'PATIENT',
  'STAFF',
  'DOCTOR',
  'ADMIN',
] as const
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''))
const optionalUrl = z.string().trim().optional().or(z.literal('')).refine(
  value => !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
  'Ingresa una URL válida',
)

export const knowledgeSourceSchema = z.object({
  authority: z.string().trim().min(2, 'Autoridad requerida').max(120),
  baseUrl: optionalUrl,
  country: z.string().trim().max(2).optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Nombre requerido').max(120),
  notes: optionalText(2000),
  sourceType: z.enum(sourceTypes),
})

export const knowledgeDocumentBaseSchema = z.object({
  audience: z.enum(audiences).optional().or(z.literal('')),
  authority: z.string().trim().min(2, 'Autoridad requerida').max(180),
  clinicalTags: optionalText(1000),
  country: z.string().trim().max(2).optional().or(z.literal('')),
  drugNames: optionalText(1000),
  redFlags: optionalText(1000),
  sourceType: z.enum(sourceTypes),
  specialty: z.enum(specialties),
  symptoms: optionalText(1000),
  title: z.string().trim().min(2, 'Título requerido').max(180),
  useCases: optionalText(500),
})

export const knowledgeTextDocumentSchema = knowledgeDocumentBaseSchema.extend({
  contentText: z.string().trim().min(20, 'El contenido debe tener al menos 20 caracteres').max(20000),
})

export const knowledgeUrlDocumentSchema = knowledgeDocumentBaseSchema.extend({
  sourceUrl: z.url({ protocol: /^https?$/ }).max(2000, 'Ingresa una URL válida'),
})

export const knowledgeFileDocumentSchema = knowledgeDocumentBaseSchema.extend({
  file: z.custom<File>(value => Boolean(value && typeof value === 'object' && 'size' in value), 'Selecciona un archivo')
    .refine(file => file.size <= 5 * 1024 * 1024, 'El archivo no puede superar 5 MB'),
})
