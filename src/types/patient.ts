import type { EntityId, IsoDateString } from './common'
import type { UserGender, UserRole } from './enums'

export interface UpdatePatientProfileDto {
  firstName?: string
  lastName?: string
  birthDate?: IsoDateString
  gender?: UserGender
}

export interface Patient {
  id?: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  birthDate?: IsoDateString | null
  gender?: UserGender
  isActive: boolean
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}

export interface PatientProfileResponseDto {
  id: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  birthDate: IsoDateString | null
  gender?: UserGender
  createdAt: IsoDateString | null
  updatedAt: IsoDateString | null
}
