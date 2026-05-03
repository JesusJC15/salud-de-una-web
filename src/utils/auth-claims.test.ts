import { AUTH0_CLAIMS_NS, extractDbId, extractEmail, extractRole } from './auth-claims'

describe('auth-claims', () => {
  describe('extractRole', () => {
    it('extracts namespaced role from Auth0 token', () => {
      expect(extractRole({ [`${AUTH0_CLAIMS_NS}role`]: 'DOCTOR' })).toBe('DOCTOR')
    })

    it('extracts plain role from legacy token', () => {
      expect(extractRole({ role: 'ADMIN' })).toBe('ADMIN')
    })

    it('normalizes lowercase role to uppercase', () => {
      expect(extractRole({ role: 'patient' })).toBe('PATIENT')
    })

    it('prefers namespaced claim over plain role', () => {
      expect(extractRole({ [`${AUTH0_CLAIMS_NS}role`]: 'DOCTOR', role: 'ADMIN' })).toBe('DOCTOR')
    })

    it('returns null for unknown role', () => {
      expect(extractRole({ role: 'SUPERUSER' })).toBeNull()
    })

    it('returns null when role is not a string', () => {
      expect(extractRole({ role: 42 })).toBeNull()
    })

    it('returns null when claims are empty', () => {
      expect(extractRole({})).toBeNull()
    })
  })

  describe('extractDbId', () => {
    it('extracts namespaced db_id from Auth0 token', () => {
      expect(extractDbId({ [`${AUTH0_CLAIMS_NS}db_id`]: 'abc123' })).toBe('abc123')
    })

    it('falls back to sub for legacy token', () => {
      expect(extractDbId({ sub: 'legacy-id' })).toBe('legacy-id')
    })

    it('prefers namespaced claim over sub', () => {
      expect(extractDbId({ [`${AUTH0_CLAIMS_NS}db_id`]: 'auth0-id', sub: 'legacy-id' })).toBe('auth0-id')
    })

    it('returns null when value is empty string', () => {
      expect(extractDbId({ sub: '' })).toBeNull()
    })

    it('returns null when value is not a string', () => {
      expect(extractDbId({ sub: 99 })).toBeNull()
    })

    it('returns null when claims are empty', () => {
      expect(extractDbId({})).toBeNull()
    })
  })

  describe('extractEmail', () => {
    it('extracts namespaced email from Auth0 token', () => {
      expect(extractEmail({ [`${AUTH0_CLAIMS_NS}email`]: 'doc@example.com' })).toBe('doc@example.com')
    })

    it('falls back to plain email for legacy token', () => {
      expect(extractEmail({ email: 'doc@example.com' })).toBe('doc@example.com')
    })

    it('returns null when email is empty string', () => {
      expect(extractEmail({ email: '' })).toBeNull()
    })

    it('returns null when email is not a string', () => {
      expect(extractEmail({ email: null })).toBeNull()
    })

    it('returns null when claims are empty', () => {
      expect(extractEmail({})).toBeNull()
    })
  })
})
