import { DoctorStatus, Specialty, UserRole } from '@/types/enums'

type StorageState = Record<string, string>

function createStorage() {
  const state: StorageState = {}

  return {
    getItem: jest.fn((key: string) => state[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      state[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete state[key]
    }),
    clear: jest.fn(() => {
      for (const key of Object.keys(state)) {
        delete state[key]
      }
    }),
    state,
  }
}

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

describe('authService', () => {
  const originalWindow = globalThis.window
  const originalFetch = globalThis.fetch
  const originalCrypto = globalThis.crypto

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    const storage = createStorage()

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: storage,
      },
    })

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: jest.fn(() => 'test-correlation-id'),
      },
    })

    globalThis.fetch = jest.fn() as typeof fetch
  })

  afterAll(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    })
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    })
    globalThis.fetch = originalFetch
  })

  it('logs in staff users and persists the session', async () => {
    const session = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'doctor@saluddeuna.com',
        role: UserRole.DOCTOR,
      },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue(createJsonResponse(session))

    const { authService } = await import('@/services/auth-service')
    const result = await authService.loginStaff({
      email: 'doctor@saluddeuna.com',
      password: 'Password1!',
    })

    expect(result).toEqual(session)
    expect(authService.getAccessToken()).toBe('access-token')
    expect(globalThis.window?.localStorage.setItem).toHaveBeenCalledWith(
      'salud-de-una.refresh-token',
      'refresh-token',
    )
    expect(globalThis.window?.localStorage.setItem).toHaveBeenCalledWith(
      'salud-de-una.user',
      JSON.stringify(session.user),
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/auth/staff/login',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('returns the stored refresh token and parses the current user', async () => {
    const { authService } = await import('@/services/auth-service')

    globalThis.window?.localStorage.setItem('salud-de-una.refresh-token', 'saved-refresh-token')
    globalThis.window?.localStorage.setItem(
      'salud-de-una.user',
      JSON.stringify({
        id: 'user-2',
        email: 'admin@saluddeuna.com',
        role: UserRole.ADMIN,
      }),
    )

    expect(authService.getRefreshToken()).toBe('saved-refresh-token')
    expect(authService.getCurrentUser()).toEqual({
      id: 'user-2',
      email: 'admin@saluddeuna.com',
      role: UserRole.ADMIN,
    })
  })

  it('clears malformed current user payloads', async () => {
    const { authService } = await import('@/services/auth-service')

    globalThis.window?.localStorage.setItem('salud-de-una.user', '{invalid-json')

    expect(authService.getCurrentUser()).toBeNull()
    expect(globalThis.window?.localStorage.removeItem).toHaveBeenCalledWith('salud-de-una.user')
  })

  it('registers doctors through the doctor registration endpoint', async () => {
    const response = {
      id: 'doctor-1',
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@saluddeuna.com',
      role: UserRole.DOCTOR,
      specialty: Specialty.GENERAL_MEDICINE,
      doctorStatus: DoctorStatus.PENDING,
      createdAt: '2026-03-22T00:00:00.000Z',
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue(createJsonResponse(response))

    const { authService } = await import('@/services/auth-service')
    const result = await authService.registerStaff({
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@saluddeuna.com',
      password: 'Password1!',
      specialty: Specialty.GENERAL_MEDICINE,
      personalId: '1234567890',
      phoneNumber: '3001234567',
      professionalLicense: '9988',
    })

    expect(result).toEqual(response)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/auth/doctor/register',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('refreshes the session only once for concurrent calls', async () => {
    globalThis.window?.localStorage.setItem('salud-de-una.refresh-token', 'refresh-token')

    const refreshedSession = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 'user-3',
        email: 'doctor@saluddeuna.com',
        role: UserRole.DOCTOR,
      },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue(createJsonResponse(refreshedSession))

    const { authService } = await import('@/services/auth-service')
    const [firstResult, secondResult] = await Promise.all([authService.refresh(), authService.refresh()])

    expect(firstResult).toEqual(refreshedSession)
    expect(secondResult).toEqual(refreshedSession)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(authService.getAccessToken()).toBe('new-access-token')
  })

  it('returns null and clears persisted session when refresh token is missing', async () => {
    const { authService } = await import('@/services/auth-service')

    authService.setAccessToken('stale-access-token')

    await expect(authService.refresh()).resolves.toBeNull()
    expect(authService.getAccessToken()).toBeNull()
    expect(globalThis.window?.localStorage.removeItem).toHaveBeenCalledWith('salud-de-una.refresh-token')
  })

  it('clears persisted session when logout fails', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse({ message: 'Server failure' }, {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }),
    )

    const { authService } = await import('@/services/auth-service')

    authService.setAccessToken('token-to-clear')
    globalThis.window?.localStorage.setItem('salud-de-una.refresh-token', 'refresh-token')

    await expect(authService.logout()).rejects.toThrow('Server failure')
    expect(authService.getAccessToken()).toBeNull()
    expect(globalThis.window?.localStorage.removeItem).toHaveBeenCalledWith('salud-de-una.refresh-token')
  })

  it('fetches the authenticated user with the current access token', async () => {
    const meResponse = {
      user: {
        id: 'user-4',
        email: 'doctor@saluddeuna.com',
        role: UserRole.DOCTOR,
        isActive: true,
      },
    }

    ;(globalThis.fetch as jest.Mock).mockResolvedValue(createJsonResponse(meResponse))

    const { authService } = await import('@/services/auth-service')
    authService.setAccessToken('access-token')

    await expect(authService.getMe()).resolves.toEqual(meResponse)

    const [, request] = (globalThis.fetch as jest.Mock).mock.calls[0]
    const headers = request.headers as Headers

    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toBe('http://localhost:3000/v1/auth/me')
    expect(headers.get('Authorization')).toBe('Bearer access-token')
  })

  it('throws when trying to fetch the current user without an active session', async () => {
    const { authService } = await import('@/services/auth-service')

    authService.setAccessToken(null)
    await expect(authService.me()).rejects.toThrow('No active session')
  })

  it('reports backend correlation ids in failed requests', async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue(
      createJsonResponse(
        {
          message: ['Credenciales invalidas'],
          correlation_id: 'cid-123',
        },
        { status: 401 },
      ),
    )

    const { authService } = await import('@/services/auth-service')

    await expect(
      authService.login({
        email: 'doctor@saluddeuna.com',
        password: 'wrong',
      }),
    ).rejects.toThrow('Credenciales invalidas [cid:cid-123]')
  })
})
