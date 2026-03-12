import type { EntityId, IsoDateString } from './common'
import type { DoctorStatus, Specialty, UserGender, UserRole } from './enums'

export interface LoginDto {
  email: string
  password: string
}

export interface LogoutDto {
  refreshToken?: string
}

export interface RefreshTokenDto {
  refreshToken: string
}

export interface RegisterDoctorDto {
  firstName: string
  lastName: string
  email: string
  password: string
  specialty: Specialty
  personalId: string
  phoneNumber: string
  professionalLicense?: string
}

export interface RegisterPatientDto {
  firstName: string
  lastName: string
  email: string
  password: string
  birthDate?: IsoDateString
  gender?: UserGender
}

export interface AuthMeUser {
  id: EntityId
  email: string
  role: UserRole
  isActive: boolean
}

export interface AuthMeResponseDto {
  user: AuthMeUser
}

export interface AuthSessionUser {
  id: EntityId
  email: string
  role: UserRole
}

export interface AuthResponseDto {
  accessToken: string
  refreshToken: string
  user: AuthSessionUser
}

export interface AuthSession extends AuthResponseDto {
  refreshSessionId: string
}

export interface RegisterPatientResponseDto {
  id: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: IsoDateString
}

export interface RegisterDoctorResponseDto {
  id: EntityId
  firstName: string
  lastName: string
  email: string
  role: UserRole
  specialty: Specialty
  doctorStatus: DoctorStatus
  createdAt: IsoDateString
}

export interface LogoutResponseDto {
  message: string
}

export interface RefreshSession {
  id?: EntityId
  sessionId: string
  userId: EntityId
  email: string
  role: UserRole
  tokenHash: string
  expiresAt: IsoDateString
  revokedAt?: IsoDateString
  revokedReason?: string
  createdAt?: IsoDateString | null
  updatedAt?: IsoDateString | null
}
