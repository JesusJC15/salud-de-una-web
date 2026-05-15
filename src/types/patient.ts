import type { EntityId, IsoDateString } from './common'
import type { UserGender, UserRole } from './enums'

export interface UpdatePatientProfileDto {
  firstName?: string
  lastName?: string
  birthDate?: IsoDateString
  gender?: UserGender
  heightCm?: number
  weightKg?: number
}

export interface Patient {
  id?: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  birthDate?: IsoDateString | null
  gender?: UserGender
  heightCm?: number | null
  weightKg?: number | null
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
  heightCm?: number | null
  weightKg?: number | null
  createdAt: IsoDateString | null
  updatedAt: IsoDateString | null
}
