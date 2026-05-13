import { z } from 'zod'
import { ProgramType, RethusState, TitleObtainingOrigin } from '@/types/enums'

const optionalUrl = z.string().trim().optional().or(z.literal('')).refine(
  value => !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
  'Ingresa una URL válida',
)

export const rethusVerifySchema = z.object({
  administrativeAct: z.string().trim().min(2, 'Acto administrativo requerido').max(180),
  evidenceUrl: optionalUrl,
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  professionOccupation: z.string().trim().min(3, 'Profesión u ocupación requerida').max(120),
  programType: z.enum(Object.values(ProgramType)),
  reportingEntity: z.string().trim().min(2, 'Entidad reportante requerida').max(180),
  rethusState: z.enum(Object.values(RethusState)),
  startDate: z.iso.date('Fecha de inicio requerida'),
  titleObtainingOrigin: z.enum(Object.values(TitleObtainingOrigin)),
})

export type RethusVerifyFormValues = z.infer<typeof rethusVerifySchema>
