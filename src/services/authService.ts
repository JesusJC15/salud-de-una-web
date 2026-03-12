import type { AuthMeResponseDto, AuthResponseDto, LoginDto, LogoutResponseDto } from '@/types'
import envConfig from '../utils/config/envConfig'

type AuthLoginTarget = 'patient' | 'staff'

interface BackendErrorResponse {
  message?: string | string[]
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const

let accessTokenInMemory: string | null = null
let refreshRequest: Promise<AuthResponseDto | null> | null = null

function getStoredItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(key)
  return value || null
}

function setStoredItem(key: string, value: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!value) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, value)
}

function getErrorMessage(payload: BackendErrorResponse | null, fallback: string) {
  if (!payload?.message) {
    return fallback
  }

  return Array.isArray(payload.message)
    ? payload.message.join(', ')
    : payload.message
}

async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as BackendErrorResponse
    return new Error(getErrorMessage(payload, fallback))
  }
  catch {
    return new Error(fallback)
  }
}

function persistSession(session: AuthResponseDto | null) {
  accessTokenInMemory = session?.accessToken ?? null
  setStoredItem(envConfig.localStorageKeys.refreshToken, session?.refreshToken ?? null)
  setStoredItem(
    envConfig.localStorageKeys.user,
    session?.user ? JSON.stringify(session.user) : null,
  )
}

async function requestAuth(
  endpoint: string,
  body?: unknown,
  fallbackError = 'Authentication request failed',
): Promise<AuthResponseDto> {
  const response = await fetch(`${envConfig.apiBaseUrl}${endpoint}`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body ?? {}),
  })

  if (!response.ok) {
    throw await readError(response, fallbackError)
  }

  const session = await response.json() as AuthResponseDto
  persistSession(session)
  return session
}

async function performRefresh(): Promise<AuthResponseDto | null> {
  const refreshToken = getStoredItem(envConfig.localStorageKeys.refreshToken)

  if (!refreshToken) {
    persistSession(null)
    return null
  }

  const response = await fetch(`${envConfig.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    persistSession(null)
    return null
  }

  const session = await response.json() as AuthResponseDto
  persistSession(session)
  return session
}

function getCurrentUserFromStorage(): AuthResponseDto['user'] | null {
  const rawUser = getStoredItem(envConfig.localStorageKeys.user)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as AuthResponseDto['user']
  }
  catch {
    setStoredItem(envConfig.localStorageKeys.user, null)
    return null
  }
}

export const authService = {
  getAccessToken(): string | null {
    return accessTokenInMemory
  },

  getRefreshToken(): string | null {
    return getStoredItem(envConfig.localStorageKeys.refreshToken)
  },

  getCurrentUser(): AuthResponseDto['user'] | null {
    return getCurrentUserFromStorage()
  },

  setAccessToken(accessToken: string | null) {
    accessTokenInMemory = accessToken
  },

  async login(credentials: LoginDto, target: AuthLoginTarget = 'patient'): Promise<AuthResponseDto> {
    return requestAuth(`/auth/${target}/login`, credentials, 'Login failed')
  },

  async loginPatient(credentials: LoginDto): Promise<AuthResponseDto> {
    return this.login(credentials, 'patient')
  },

  async loginStaff(credentials: LoginDto): Promise<AuthResponseDto> {
    return this.login(credentials, 'staff')
  },

  async refresh(): Promise<AuthResponseDto | null> {
    refreshRequest ??= performRefresh().finally(() => {
      refreshRequest = null
    })

    return refreshRequest
  },

  async logout(): Promise<LogoutResponseDto> {
    const refreshToken = this.getRefreshToken()

    try {
      const response = await fetch(`${envConfig.apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw await readError(response, 'Logout failed')
      }

      return await response.json() as LogoutResponseDto
    }
    finally {
      persistSession(null)
    }
  },

  async me(): Promise<AuthMeResponseDto> {
    const accessToken = this.getAccessToken() ?? (await this.refresh())?.accessToken

    if (!accessToken) {
      throw new Error('No active session')
    }

    const response = await fetch(`${envConfig.apiBaseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw await readError(response, 'Unable to fetch authenticated user')
    }

    return await response.json() as AuthMeResponseDto
  },
}
