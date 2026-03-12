import type { UserRole } from './enums'

export type EntityId = string
export type IsoDateString = string
export type TokenType = 'access' | 'refresh'

export interface JwtPayload {
  sub: EntityId
  role: UserRole
  email: string
  jti?: string
  iat?: number
  exp?: number
  tokenType: TokenType
}

export interface RequestUser {
  userId: EntityId
  email: string
  role: UserRole
  isActive: boolean
}

export interface HealthStatus {
  status: 'ok'
  service: string
  timestamp: IsoDateString
  uptimeSeconds: number
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready'
  service: string
  timestamp: IsoDateString
  checks: {
    database: {
      status: 'up' | 'down'
      detail: string
    }
  }
}

export interface RequestMetric {
  latencyMs: number
  statusCode: number
}
