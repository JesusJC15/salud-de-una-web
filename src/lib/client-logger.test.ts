import { clientLogger, sanitizeLogMetadata } from './client-logger'

// ─── sanitizeLogMetadata ────────────────────────────────────────────────────

describe('sanitizeLogMetadata', () => {
  it('redacts sensitive metadata fields', () => {
    expect(sanitizeLogMetadata({
      token: 'secret-token',
      nested: { patientName: 'Ana', status: 'failed' },
      safeCount: 2,
    })).toEqual({
      token: '[redacted]',
      nested: { patientName: '[redacted]', status: 'failed' },
      safeCount: 2,
    })
  })

  it('returns undefined when no metadata is provided', () => {
    expect(sanitizeLogMetadata(undefined)).toBeUndefined()
  })

  it('truncates strings longer than 240 characters', () => {
    const longString = 'x'.repeat(300)
    const result = sanitizeLogMetadata({ info: longString }) as Record<string, string>
    expect(result.info).toHaveLength(243) // 240 + '...'
    expect(result.info!.endsWith('...')).toBe(true)
  })

  it('keeps strings of exactly 240 characters intact', () => {
    const exactString = 'a'.repeat(240)
    const result = sanitizeLogMetadata({ info: exactString }) as Record<string, string>
    expect(result.info).toHaveLength(240)
  })

  it('redacts sensitive keys inside arrays of objects', () => {
    const result = sanitizeLogMetadata({
      items: [{ token: 'abc', name: 'ok' }],
    }) as { items: Array<Record<string, string>> }
    expect(result.items[0]!.token).toBe('[redacted]')
    expect(result.items[0]!.name).toBe('ok')
  })

  it('slices arrays to a maximum of 20 elements', () => {
    const bigArray = Array.from({ length: 25 }, (_, i) => i)
    const result = sanitizeLogMetadata({ data: bigArray }) as { data: number[] }
    expect(result.data).toHaveLength(20)
  })

  it('passes through numbers and booleans unchanged', () => {
    expect(sanitizeLogMetadata({ count: 42, active: true })).toEqual({
      count: 42,
      active: true,
    })
  })
})

// ─── clientLogger.log ──────────────────────────────────────────────────────

describe('clientLogger.log', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchMock
    Object.defineProperty(globalThis, 'window', {
      value: { location: { pathname: '/test-path' } },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('posts log events to /api/client-events', async () => {
    await clientLogger.log({ level: 'info', message: 'test event' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/client-events',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ level: 'info', message: 'test event' })
  })

  it('uses window.location.pathname as path when path is not provided', async () => {
    await clientLogger.log({ level: 'warn', message: 'no path' })
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.path).toBe('/test-path')
  })

  it('prefers the explicit path over window.location.pathname', async () => {
    await clientLogger.log({ level: 'info', message: 'with path', path: '/explicit' })
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.path).toBe('/explicit')
  })

  it('does not throw when fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))
    await expect(clientLogger.log({ level: 'error', message: 'fetch fail' })).resolves.not.toThrow()
  })

  it('is a no-op when window is undefined (SSR)', async () => {
    Object.defineProperty(globalThis, 'window', { value: undefined, writable: true, configurable: true })
    await clientLogger.log({ level: 'info', message: 'ssr call' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ─── clientLogger convenience methods ──────────────────────────────────────

describe('clientLogger convenience methods', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchMock
    Object.defineProperty(globalThis, 'window', {
      value: { location: { pathname: '/' } },
      writable: true,
      configurable: true,
    })
  })

  it('clientLogger.error sends level "error"', async () => {
    await clientLogger.error('something broke', { component: 'TestComp' })
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ level: 'error', message: 'something broke', component: 'TestComp' })
  })

  it('clientLogger.warn sends level "warn"', async () => {
    await clientLogger.warn('suspicious activity')
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toMatchObject({ level: 'warn', message: 'suspicious activity' })
  })
})
