describe('authService (Auth0 adapter)', () => {
  const mockGetToken = jest.fn<Promise<string>, []>()
  const mockLogout = jest.fn<void, [{ logoutParams: { returnTo: string } }]>()
  const originalFetch = globalThis.fetch

  function mockBrowserSessionStorage(initialValues?: Record<string, string>) {
    const store = new Map(Object.entries(initialValues ?? {}))
    const sessionStorage = {
      getItem: jest.fn((key: string) => store.get(key) ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value)
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key)
      }),
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://staff.salud-de-una.com' } },
    })
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: sessionStorage,
    })

    return sessionStorage
  }

  async function importFreshAuthService() {
    jest.resetModules()
    return import('./auth-service')
  }

  async function withNodeEnv<T>(value: string, fn: () => Promise<T> | T): Promise<T> {
    const env = process.env as Record<string, string | undefined>
    const previous = env.NODE_ENV
    env.NODE_ENV = value

    try {
      return await fn()
    }
    finally {
      if (previous === undefined) {
        delete env.NODE_ENV
      }
      else {
        env.NODE_ENV = previous
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    delete (globalThis as Partial<typeof globalThis>).window
    delete (globalThis as Partial<typeof globalThis>).sessionStorage
    delete process.env.NEXT_PUBLIC_API_BASE_URL
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('returns null when not initialized and there is no browser session', async () => {
    const { authService } = await importFreshAuthService()

    await expect(authService.getAccessToken()).resolves.toBeNull()
    expect(authService.getRefreshToken()).toBeNull()
    expect(authService.isAuthenticated()).toBe(false)
  })

  it('stores and reads legacy session tokens from sessionStorage', async () => {
    const sessionStorage = mockBrowserSessionStorage()

    await withNodeEnv('development', async () => {
      const { authService, initAuthService } = await importFreshAuthService()
      initAuthService(mockGetToken, mockLogout, false)

      await authService.initLegacySession('legacy-access', 'legacy-refresh')

      expect(sessionStorage.setItem).toHaveBeenCalledWith('salud-de-una.legacy.access', 'legacy-access')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('salud-de-una.legacy.refresh', 'legacy-refresh')
      expect(authService.isAuthenticated()).toBe(true)
      expect(authService.getRefreshToken()).toBe('legacy-refresh')
    })
  })

  it('falls back to the legacy access token when Auth0 token retrieval fails', async () => {
    mockBrowserSessionStorage({
      'salud-de-una.legacy.access': 'legacy-access',
      'salud-de-una.legacy.refresh': 'legacy-refresh',
    })
    mockGetToken.mockRejectedValue(new Error('Login required'))

    const { authService, initAuthService } = await importFreshAuthService()
    initAuthService(mockGetToken, mockLogout, false)

    await expect(authService.getAccessToken()).resolves.toBe('legacy-access')
  })

  it('returns the Auth0 token when authenticated', async () => {
    mockGetToken.mockResolvedValue('auth0-access-token')

    const { authService, initAuthService } = await importFreshAuthService()
    initAuthService(mockGetToken, mockLogout, true)

    await expect(authService.getAccessToken()).resolves.toBe('auth0-access-token')
    await expect(authService.refresh()).resolves.toEqual({ accessToken: 'auth0-access-token' })
    expect(authService.getRefreshToken()).toBe('__auth0_managed__')
    expect(authService.isAuthenticated()).toBe(true)
  })

  it('refreshes a legacy session and preserves the previous refresh token when the backend omits a new one', async () => {
    const sessionStorage = mockBrowserSessionStorage({
      'salud-de-una.legacy.refresh': 'legacy-refresh',
    })
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ accessToken: 'new-access-token' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch

    await withNodeEnv('development', async () => {
      const { authService } = await importFreshAuthService()

      await expect(authService.refresh()).resolves.toEqual({ accessToken: 'new-access-token' })
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:3000/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'legacy-refresh' }),
      })
      expect(sessionStorage.setItem).toHaveBeenCalledWith('salud-de-una.legacy.access', 'new-access-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('salud-de-una.legacy.refresh', 'legacy-refresh')
    })
  })

  it('returns null when there is no legacy refresh token to exchange', async () => {
    mockBrowserSessionStorage()
    globalThis.fetch = jest.fn() as typeof fetch

    const { authService } = await importFreshAuthService()

    await expect(authService.refresh()).resolves.toBeNull()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('clears the legacy session when refresh fails or the backend rejects it', async () => {
    const sessionStorage = mockBrowserSessionStorage({
      'salud-de-una.legacy.refresh': 'legacy-refresh',
    })
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 401 })) as typeof fetch

    const { authService } = await importFreshAuthService()

    await expect(authService.refresh()).resolves.toBeNull()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('salud-de-una.legacy.access')
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('salud-de-una.legacy.refresh')

    authService.initLegacySession('legacy-access', 'legacy-refresh')
    ;(globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('socket hang up'))
    await expect(authService.refresh()).resolves.toBeNull()
  })

  it('syncClientSession syncs the token to the server cookie', async () => {
    mockBrowserSessionStorage()
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 200 })) as typeof fetch

    const { authService } = await importFreshAuthService()

    await authService.syncClientSession('some-token')

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/session', expect.objectContaining({ method: 'POST' }))
  })

  it('syncClientSession with null token clears the server cookie', async () => {
    mockBrowserSessionStorage()
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 200 })) as typeof fetch

    const { authService } = await importFreshAuthService()

    await authService.syncClientSession(null)

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/session', expect.objectContaining({ method: 'DELETE' }))
  })

  it('getCurrentUser returns user when token is valid and backend responds ok', async () => {
    mockBrowserSessionStorage()
    const mockUser = { id: 'u1', email: 'doc@test.com', role: 'DOCTOR' }
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: mockUser }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ) as typeof fetch

    const { authService } = await importFreshAuthService()

    const result = await authService.getCurrentUser('valid-token')

    expect(result).toEqual(mockUser)
  })

  it('getCurrentUser returns null when token override is not provided and no token exists', async () => {
    const { authService } = await importFreshAuthService()

    const result = await authService.getCurrentUser()

    expect(result).toBeNull()
  })

  it('getCurrentUser returns null when backend responds with non-ok status', async () => {
    mockBrowserSessionStorage()
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 401 })) as typeof fetch

    const { authService } = await importFreshAuthService()

    const result = await authService.getCurrentUser('expired-token')

    expect(result).toBeNull()
  })

  it('getCurrentUser returns null when fetch throws', async () => {
    mockBrowserSessionStorage()
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network error')) as typeof fetch

    const { authService } = await importFreshAuthService()

    const result = await authService.getCurrentUser('some-token')

    expect(result).toBeNull()
  })

  it('logs out through Auth0 in the browser and resets internal state', async () => {
    const sessionStorage = mockBrowserSessionStorage({
      'salud-de-una.legacy.access': 'legacy-access',
      'salud-de-una.legacy.refresh': 'legacy-refresh',
    })
    mockGetToken.mockResolvedValue('auth0-access-token')

    const { authService, initAuthService } = await importFreshAuthService()
    initAuthService(mockGetToken, mockLogout, true)

    await authService.logout()

    expect(sessionStorage.removeItem).toHaveBeenCalledWith('salud-de-una.legacy.access')
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('salud-de-una.legacy.refresh')
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: 'https://staff.salud-de-una.com' },
    })
    expect(authService.isAuthenticated()).toBe(false)
    await expect(authService.getAccessToken()).resolves.toBeNull()
  })
})
