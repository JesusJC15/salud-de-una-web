import type { EntityId, IsoDateString } from './common'
import type {
  DoctorStatus,
  ProgramType,
  RethusState,
  Specialty,
  TitleObtainingOrigin,
  UserRole,
} from './enums'

export interface RethusVerification {
  id?: EntityId
  doctorId: EntityId
  programType: ProgramType
  titleObtainingOrigin: TitleObtainingOrigin
  professionOccupation: string
  startDate: IsoDateString
  rethusState: RethusState
  administrativeAct: string
  reportingEntity: string
  checkedBy: string
  checkedAt: IsoDateString
  evidenceUrl?: string
  notes?: string
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}

export interface Doctor {
  id?: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  specialty: Specialty
  personalId: string
  phoneNumber: string
  professionalLicense?: string
  doctorStatus: DoctorStatus
  rethusVerificationId?: EntityId
  isActive: boolean
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}

export interface DoctorMeVerificationResponseDto {
  programType: ProgramType
  titleObtainingOrigin: TitleObtainingOrigin
  professionOccupation: string
  startDate: IsoDateString
  rethusState: RethusState
  administrativeAct: string
  reportingEntity: string
  checkedAt: IsoDateString
  checkedBy: string
  evidenceUrl?: string
  notes?: string
}

export interface DoctorMeResponseDto {
  id: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  specialty: Specialty
  doctorStatus: DoctorStatus
  verification: DoctorMeVerificationResponseDto | null
}
