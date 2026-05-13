import { sanitizeLogMetadata } from './client-logger'

describe('clientLogger', () => {
  it('redacts sensitive metadata fields', () => {
    expect(sanitizeLogMetadata({
      token: 'secret-token',
      nested: {
        patientName: 'Ana',
        status: 'failed',
      },
      safeCount: 2,
    })).toEqual({
      token: '[redacted]',
      nested: {
        patientName: '[redacted]',
        status: 'failed',
      },
      safeCount: 2,
    })
  })
})
