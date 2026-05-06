const getAccessToken = jest.fn()
const getRefreshToken = jest.fn()
const refresh = jest.fn()
const logout = jest.fn()

jest.mock('@/services/auth-service', () => ({
  authService: {
    getAccessToken,
    getRefreshToken,
    refresh,
    logout,
  },
}))

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
    ...init,
  })
}

describe('apiClient', () => {
  const originalFetch = globalThis.fetch
  const originalCrypto = globalThis.crypto

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()

    getAccessToken.mockReturnValue('access-token')
    getRefreshToken.mockReturnValue('refresh-token')
    refresh.mockResolvedValue({ accessToken: 'refreshed-token' })
    logout.mockResolvedValue(undefined)

    globalThis.fetch = jest.fn() as typeof fetch

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: jest.fn(() => 'api-correlation-id'),
      },
    })
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    })
  })

  it('builds authenticated GET requests with normalized urls and params', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse({
        items: [
          1,
          2,
          3,
        ],
      }, {
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': 'server-cid',
        },
      }),
    )

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('/users/')
    const response = await client.get<{ items: number[] }>('/list', {
      params: {
        page: 1,
        active: true,
        ignored: null,
      },
    })

    expect(response.data).toEqual({
      items: [
        1,
        2,
        3,
      ],
    })
    expect(response.correlationId).toBe('server-cid')
    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:3000/v1/users/list?page=1&active=true',
    )

    const headers = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers as Headers
    expect((globalThis.fetch as jest.Mock).mock.calls[0][1].method).toBe('GET')
    expect(headers.get('Authorization')).toBe('Bearer access-token')
    expect(headers.get('Accept')).toBe('application/json')
  })

  it('sends JSON bodies for POST requests', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(createJsonResponse({ ok: true }))

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('auth')

    await client.post('login', { email: 'ana@saluddeuna.com' }, false)

    const [, request] = (globalThis.fetch as jest.Mock).mock.calls[0]
    const headers = request.headers as Headers

    expect(request.body).toBe(JSON.stringify({ email: 'ana@saluddeuna.com' }))
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('reuses caller-provided headers and correlation ids', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(createJsonResponse({ ok: true }))

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('auth')

    await client.request({
      endpoint: '/login',
      method: 'POST',
      data: { email: 'ana@saluddeuna.com' },
      correlationId: 'client-cid',
      headers: {
        Accept: 'text/plain',
        'x-correlation-id': 'header-cid',
      },
      requiresAuth: false,
    })

    const [, request] = (globalThis.fetch as jest.Mock).mock.calls[0]
    const headers = request.headers as Headers
    expect(headers.get('Accept')).toBe('text/plain')
    expect(headers.get('x-correlation-id')).toBe('header-cid')
  })

  it('returns undefined for 204 responses', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 204 }))

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('users')
    const response = await client.delete('current')

    expect(response.data).toBeUndefined()
    expect(response.status).toBe(204)
  })

  it('reads plain text responses when content is not json', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(new Response('pong', { status: 200 }))

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('health')
    const response = await client.get<string>('ping', false)

    expect(response.data).toBe('pong')
  })

  it('passes through non-json request bodies for write helpers', async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(createJsonResponse({ ok: true }))
      .mockResolvedValueOnce(createJsonResponse({ ok: true }))

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')
    const formData = new FormData()
    formData.set('avatar', 'binary-data')

    await client.put('avatar', formData)
    await client.patch('preferences', new URLSearchParams({ theme: 'light' }))

    const firstHeaders = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers as Headers
    const secondRequest = (globalThis.fetch as jest.Mock).mock.calls[1][1]
    expect((globalThis.fetch as jest.Mock).mock.calls[0][1].body).toBe(formData)
    expect(firstHeaders.get('Content-Type')).toBeNull()
    expect(secondRequest.body).toBeInstanceOf(URLSearchParams)
  })

  it('retries once after a 401 when refresh succeeds', async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(createJsonResponse({ message: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(createJsonResponse({ id: 'user-1' }))

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')
    const response = await client.get<{ id: string }>('me')

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(response.data).toEqual({ id: 'user-1' })
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('throws session expired when refresh does not return a token', async () => {
    refresh.mockResolvedValueOnce(null)
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      createJsonResponse({ message: 'expired' }, { status: 401 }),
    )

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')

    await expect(client.get('me')).rejects.toThrow('Session expired')
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('throws session expired when auth refresh cannot recover the initial token', async () => {
    getAccessToken.mockReturnValueOnce(null)
    getRefreshToken.mockReturnValueOnce('refresh-token')
    refresh.mockResolvedValueOnce({ accessToken: null })

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')

    await expect(client.get('me')).rejects.toThrow('Session expired')
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('throws user not authenticated when auth is required and there is no session', async () => {
    getAccessToken.mockReturnValueOnce(null)
    getRefreshToken.mockReturnValueOnce(null)

    const { apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')

    await expect(client.get('me')).rejects.toThrow('User not authenticated')
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('normalizes backend errors into ApiClientError', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        {
          message: ['Campo requerido'],
          correlation_id: 'cid-456',
          path: '/profile/me',
          statusCode: 400,
          timestamp: '2026-03-22T00:00:00.000Z',
        },
        { status: 400 },
      ),
    )

    const { ApiClientError, apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')

    try {
      await client.get('me')
      throw new Error('Expected client.get to fail')
    }
    catch (error) {
      expect(error).toBeInstanceOf(ApiClientError)
      expect(error).toMatchObject({
        message: 'Campo requerido',
        correlationId: 'cid-456',
        path: '/profile/me',
        status: 400,
        timestamp: '2026-03-22T00:00:00.000Z',
      })
    }
  })

  it('falls back to a generic error when the backend payload cannot be parsed', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(new Response('<html>oops</html>', {
      status: 500,
      headers: {
        'content-type': 'text/html',
        'x-correlation-id': 'fallback-cid',
      },
    }))

    const { ApiClientError, apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')

    await expect(client.get('me')).rejects.toBeInstanceOf(ApiClientError)
    await expect(client.get('me')).rejects.toMatchObject({
      message: 'Request failed with status 500',
      correlationId: 'fallback-cid',
      status: 500,
    })
  })

  it('surfaces network failures as ApiClientError', async () => {
    ;(globalThis.fetch as jest.Mock).mockRejectedValue(new Error('socket hang up'))

    const { ApiClientError, apiClient } = await import('@/api/api-client')
    const client = apiClient('profile')

    const request = client.get('me')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: 'Network error',
      correlationId: 'api-correlation-id',
    })
  })

  it('reports request timeout when the internal timeout aborts the fetch', async () => {
    jest.useFakeTimers()
    ;(globalThis.fetch as jest.Mock).mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        if (init?.signal?.aborted) {
          const abortError = new Error('Timed out')
          abortError.name = 'AbortError'
          reject(abortError)
          return
        }
        init?.signal?.addEventListener('abort', () => {
          const abortError = new Error('Timed out')
          abortError.name = 'AbortError'
          reject(abortError)
        }, { once: true })
      })
    })

    const { ApiClientError, apiClient } = await import('@/api/api-client')
    const request = apiClient('profile').get('me', { timeoutMs: 5 }).catch(error => error)
    await jest.advanceTimersByTimeAsync(5)

    const error = await request
    expect(error).toBeInstanceOf(ApiClientError)
    expect(error).toMatchObject({
      message: 'Request timeout',
      status: 408,
    })
  })

  it('reports request aborted when the caller aborts the signal', async () => {
    ;(globalThis.fetch as jest.Mock).mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        if (init?.signal?.aborted) {
          const abortError = new Error('Aborted')
          abortError.name = 'AbortError'
          reject(abortError)
          return
        }
        init?.signal?.addEventListener('abort', () => {
          const abortError = new Error('Aborted')
          abortError.name = 'AbortError'
          reject(abortError)
        }, { once: true })
      })
    })

    const { ApiClientError, apiClient } = await import('@/api/api-client')
    const controller = new AbortController()
    const request = apiClient('profile').get('me', { signal: controller.signal, timeoutMs: 50 })
    controller.abort()

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      message: 'Request aborted',
      status: undefined,
    })
  })
})
