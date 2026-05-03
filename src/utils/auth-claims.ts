// Centralized Auth0 custom claims utilities.
// The namespace must match the one used in the Auth0 Post-Login Action.
export const AUTH0_CLAIMS_NS = 'https://salud-de-una.com/'

export type AppRole = 'DOCTOR' | 'ADMIN' | 'PATIENT'

const VALID_ROLES: AppRole[] = [
  'DOCTOR',
  'ADMIN',
  'PATIENT',
]

export function extractRole(claims: Record<string, unknown>): AppRole | null {
  // Auth0 tokens use the namespaced claim; legacy HMAC tokens use plain `role`
  const raw = claims[`${AUTH0_CLAIMS_NS}role`] ?? claims.role
  if (typeof raw !== 'string')
    return null
  const normalized = raw.toUpperCase() as AppRole
  return VALID_ROLES.includes(normalized) ? normalized : null
}

export function extractDbId(claims: Record<string, unknown>): string | null {
  // Auth0 tokens carry db_id as a custom claim; legacy HMAC tokens use `sub` (MongoDB ObjectId)
  const value = claims[`${AUTH0_CLAIMS_NS}db_id`] ?? claims.sub
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function extractEmail(claims: Record<string, unknown>): string | null {
  const value = claims[`${AUTH0_CLAIMS_NS}email`] ?? claims.email
  return typeof value === 'string' && value.length > 0 ? value : null
}
