import type { AuthMeResponseDto, AuthResponseDto, LoginDto, LogoutResponseDto } from '@/types'
import envConfig from '../utils/config/envConfig'

type AuthLoginTarget = 'patient' | 'staff'

export interface BackendErrorResponse {
  correlation_id?: string
  message?: string | string[]
  path?: string
  statusCode?: number
  timestamp?: string
}

export interface TimeoutController {
  cleanup: () => void
  didTimeout: () => boolean
  signal?: AbortSignal
}

const JSON_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
} as const

const CORRELATION_HEADER = 'x-correlation-id'
const DEFAULT_AUTH_TIMEOUT_MS = 15_000

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

export function createCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function createTimeoutController(
  timeoutMs: number,
  externalSignal?: AbortSignal,
): TimeoutController {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return {
      cleanup: () => {},
      didTimeout: () => false,
      signal: externalSignal,
    }
  }

  const controller = new AbortController()
  let timedOut = false

  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const onAbort = () => {
    controller.abort()
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    }
    else {
      externalSignal.addEventListener('abort', onAbort, { once: true })
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId)
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onAbort)
      }
    },
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as BackendErrorResponse
    const message = getErrorMessage(payload, fallback)
    const correlationId = payload.correlation_id || response.headers.get(CORRELATION_HEADER)

    return new Error(correlationId ? `${message} [cid:${correlationId}]` : message)
  }
  catch {
    const correlationId = response.headers.get(CORRELATION_HEADER)
    return new Error(correlationId ? `${fallback} [cid:${correlationId}]` : fallback)
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('Unexpected response format')
  }

  return await response.json() as T
}

async function fetchJson<T>(
  url: string,
  options: RequestInit,
  fallbackError: string,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has(CORRELATION_HEADER)) {
    headers.set(CORRELATION_HEADER, createCorrelationId())
  }

  const timeout = createTimeoutController(DEFAULT_AUTH_TIMEOUT_MS, options.signal ?? undefined)

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: timeout.signal,
    })
  }
  catch (error) {
    timeout.cleanup()

    if (error instanceof Error && error.name === 'AbortError') {
      if (timeout.didTimeout()) {
        throw new Error('Request timeout')
      }

      throw new Error('Request aborted')
    }

    throw new Error('Network error')
  }
  finally {
    timeout.cleanup()
  }

  if (!response.ok) {
    throw await readError(response, fallbackError)
  }

  return readJson<T>(response)
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
  const session = await fetchJson<AuthResponseDto>(
    `${envConfig.apiBaseUrl}${endpoint}`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body ?? {}),
    },
    fallbackError,
  )

  persistSession(session)
  return session
}

async function performRefresh(): Promise<AuthResponseDto | null> {
  const refreshToken = getStoredItem(envConfig.localStorageKeys.refreshToken)

  if (!refreshToken) {
    persistSession(null)
    return null
  }

  try {
    const session = await fetchJson<AuthResponseDto>(
      `${envConfig.apiBaseUrl}/auth/refresh`,
      {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ refreshToken }),
      },
      'Session refresh failed',
    )

    persistSession(session)
    return session
  }
  catch {
    persistSession(null)
    return null
  }
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
    const authResponse = await fetchJson<AuthResponseDto>(
      `${envConfig.apiBaseUrl}/auth/${target}/login`,
      {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(credentials),
        credentials: 'include',
      },
      'Login failed',
    )

    // Keep existing token-based behavior while also enabling cookie-based auth
    persistSession(authResponse)

    return authResponse
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
      return await fetchJson<LogoutResponseDto>(
        `${envConfig.apiBaseUrl}/auth/logout`,
        {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        },
        'Logout failed',
      )
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

    return await fetchJson<AuthMeResponseDto>(
      `${envConfig.apiBaseUrl}/auth/me`,
      {
        headers: {
          ...JSON_HEADERS,
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      },
      'Unable to fetch authenticated user',
    )
  },

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken())
  },
}
