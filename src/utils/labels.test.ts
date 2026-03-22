import {
  DoctorStatus,
  ProgramType,
  RethusState,
  Specialty,
  TitleObtainingOrigin,
  UserGender,
  UserRole,
} from '@/types/enums'
import {
  DOCTOR_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
  RETHUS_STATE_LABELS,
  SPECIALTY_LABELS,
  TITLE_OBTAINING_ORIGIN_LABELS,
  translateDoctorStatus,
  translateEnumValue,
  translateProgramType,
  translateRethusState,
  translateSpecialty,
  translateTitleObtainingOrigin,
  translateUserGender,
  translateUserRole,
  USER_GENDER_LABELS,
  USER_ROLE_LABELS,
} from '@/utils'

describe('translateEnumValue', () => {
  it('returns an empty string when there is no value', () => {
    expect(translateEnumValue(USER_ROLE_LABELS, undefined)).toBe('')
  })

  it('falls back to the original value when no translation exists', () => {
    expect(translateEnumValue(USER_ROLE_LABELS, 'UNKNOWN')).toBe('UNKNOWN')
  })
})

describe('enum label translators', () => {
  it('translates doctor status values', () => {
    expect(DOCTOR_STATUS_LABELS[DoctorStatus.PENDING]).toBe('Pendiente de verificacion')
    expect(translateDoctorStatus(DoctorStatus.VERIFIED)).toBe('Verificado')
  })

  it('translates program type values', () => {
    expect(PROGRAM_TYPE_LABELS[ProgramType.MASTERS]).toBe('Maestria')
    expect(translateProgramType(ProgramType.PROFESSIONAL_TECHNICAL)).toBe('Tecnico profesional')
  })

  it('translates rethus state values', () => {
    expect(RETHUS_STATE_LABELS[RethusState.EXPIRED]).toBe('Expirado')
    expect(translateRethusState(RethusState.VALID)).toBe('Valido')
  })

  it('translates specialties', () => {
    expect(SPECIALTY_LABELS[Specialty.ODONTOLOGY]).toBe('Odontología')
    expect(translateSpecialty(Specialty.GENERAL_MEDICINE)).toBe('Medicina general')
  })

  it('translates title obtaining origin values', () => {
    expect(TITLE_OBTAINING_ORIGIN_LABELS[TitleObtainingOrigin.FOREIGN]).toBe('Extranjero')
    expect(translateTitleObtainingOrigin(TitleObtainingOrigin.LOCAL)).toBe('Local')
  })

  it('translates user gender values', () => {
    expect(USER_GENDER_LABELS[UserGender.OTHER]).toBe('Otro')
    expect(translateUserGender(UserGender.FEMALE)).toBe('Femenino')
  })

  it('translates user role values', () => {
    expect(USER_ROLE_LABELS[UserRole.ADMIN]).toBe('Administrador')
    expect(translateUserRole(UserRole.DOCTOR)).toBe('Doctor')
  })
})
