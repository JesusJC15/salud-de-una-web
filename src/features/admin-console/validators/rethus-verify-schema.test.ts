import { ProgramType, RethusState, TitleObtainingOrigin } from '@/types/enums'
import { rethusVerifySchema } from './rethus-verify-schema'

describe('rethusVerifySchema', () => {
  it('accepts a complete REThUS verification payload', () => {
    expect(rethusVerifySchema.parse({
      administrativeAct: 'Acta 123',
      evidenceUrl: 'https://rethus.example/doctor/1',
      notes: '',
      professionOccupation: 'Medicina general',
      programType: ProgramType.UNIVERSITY,
      reportingEntity: 'Ministerio de Salud',
      rethusState: RethusState.VALID,
      startDate: '2026-01-01',
      titleObtainingOrigin: TitleObtainingOrigin.LOCAL,
    })).toMatchObject({
      administrativeAct: 'Acta 123',
      rethusState: RethusState.VALID,
    })
  })

  it('rejects missing auditable fields', () => {
    expect(() => rethusVerifySchema.parse({
      administrativeAct: '',
      evidenceUrl: '',
      notes: '',
      professionOccupation: '',
      programType: ProgramType.UNIVERSITY,
      reportingEntity: '',
      rethusState: RethusState.VALID,
      startDate: '',
      titleObtainingOrigin: TitleObtainingOrigin.LOCAL,
    })).toThrow()
  })
})
