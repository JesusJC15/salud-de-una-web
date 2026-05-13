import type { AuthMeResponseDto, AuthMeUser } from '@/types/auth'
import { trimTrailingSlashes } from '@/lib/utils'
import envConfig from '@/utils/config/envConfig'

type GetTokenFn = () => Promise<string>
type LogoutFn = (options: { logoutParams: { returnTo: string } }) => void

let _getToken: GetTokenFn | null = null
let _logout: LogoutFn | null = null
let _isAuthenticated = false
let _lastSyncedAccessToken: string | null = null

const SS_ACCESS = 'salud-de-una.legacy.access'
const SS_REFRESH = 'salud-de-una.legacy.refresh'
const SESSION_ENDPOINT = '/api/session'

function ssGet(key: string): string | null {
  if (typeof window === 'undefined')
    return null
  return sessionStorage.getItem(key)
}

function ssSet(key: string, value: string): void {
  if (typeof window !== 'undefined')
    sessionStorage.setItem(key, value)
}

function ssClear(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SS_ACCESS)
    sessionStorage.removeItem(SS_REFRESH)
  }
}

function getApiBaseUrl() {
  return trimTrailingSlashes(envConfig.backendOrigin)
}

function allowLegacyBrowserStorage() {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE === 'true'
}

async function syncServerSessionCookie(token: string | null): Promise<void> {
  if (typeof fetch !== 'function' || typeof window === 'undefined')
    return

  try {
    if (!token) {
      await fetch(SESSION_ENDPOINT, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      return
    }

    await fetch(SESSION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ accessToken: token }),
    })
  }
  catch {
    // Best effort. Route protection revalidates against the backend.
  }
}

export function initAuthService(
  getAccessTokenSilently: GetTokenFn,
  logout: LogoutFn,
  isAuthenticated: boolean,
) {
  _getToken = getAccessTokenSilently
  _logout = logout
  _isAuthenticated = isAuthenticated
}

export const authService = {
  async initLegacySession(accessToken: string, refreshToken: string): Promise<void> {
    // SECURITY: Token storage in sessionStorage disabled for production
    // Tokens should only be in httpOnly cookies (BFF) or Auth0 managed
    if (allowLegacyBrowserStorage()) {
      ssSet(SS_ACCESS, accessToken)
      ssSet(SS_REFRESH, refreshToken)
    }
    await syncServerSessionCookie(accessToken)
    _lastSyncedAccessToken = accessToken
  },

  async syncClientSession(token: string | null): Promise<void> {
    await syncServerSessionCookie(token)
    _lastSyncedAccessToken = token
  },

  async syncSession(token: string | null): Promise<void> {
    await this.syncClientSession(token)
  },

  async getAccessToken(): Promise<string | null> {
    if (_getToken) {
      try {
        const token = await _getToken()
        if (token) {
          if (token !== _lastSyncedAccessToken) {
            _lastSyncedAccessToken = token
            void syncServerSessionCookie(token)
          }
          return token
        }
      }
      catch {
        // fall through to legacy
      }
    }

    // Try to obtain token from server-side httpOnly cookie (BFF) — same-origin GET
    try {
      const res = await fetch(SESSION_ENDPOINT, { method: 'GET', credentials: 'same-origin' })
      if (res.ok && res.status !== 204) {
        const data = await res.json() as { accessToken?: string }
        const serverToken = data.accessToken ?? null
        if (serverToken) {
          _lastSyncedAccessToken = serverToken
          return serverToken
        }
      }
    }
    catch {
      // fall through to legacy
    }

    const legacyToken = allowLegacyBrowserStorage() ? ssGet(SS_ACCESS) : null
    if (legacyToken && legacyToken !== _lastSyncedAccessToken) {
      _lastSyncedAccessToken = legacyToken
      void syncServerSessionCookie(legacyToken)
    }

    return legacyToken
  },

  async refresh(): Promise<{ accessToken: string | null } | null> {
    if (_getToken) {
      const token = await this.getAccessToken()
      if (token)
        return { accessToken: token }
    }

    const refreshToken = ssGet(SS_REFRESH)
    // In production, don't use sessionStorage refresh token
    if (!allowLegacyBrowserStorage() && !refreshToken) {
      return null
    }
    if (!refreshToken)
      return null

    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        ssClear()
        await syncServerSessionCookie(null)
        return null
      }
      const data = await res.json() as { accessToken: string, refreshToken?: string }
      // Only store in sessionStorage in development
      if (allowLegacyBrowserStorage()) {
        ssSet(SS_ACCESS, data.accessToken)
        ssSet(SS_REFRESH, data.refreshToken ?? refreshToken)
      }
      await syncServerSessionCookie(data.accessToken)
      _lastSyncedAccessToken = data.accessToken
      return { accessToken: data.accessToken }
    }
    catch {
      ssClear()
      await syncServerSessionCookie(null)
      return null
    }
  },

  getRefreshToken(): string | null {
    if (_isAuthenticated)
      return '__auth0_managed__'
    // In production, don't return sessionStorage tokens
    if (!allowLegacyBrowserStorage()) {
      return null
    }
    return ssGet(SS_REFRESH)
  },

  isAuthenticated(): boolean {
    if (_isAuthenticated)
      return true
    // In production, only trust Auth0 authentication state
    if (!allowLegacyBrowserStorage()) {
      return false
    }
    return ssGet(SS_ACCESS) !== null
  },

  async getCurrentUser(tokenOverride?: string | null): Promise<AuthMeUser | null> {
    const token = tokenOverride ?? await this.getAccessToken()
    if (!token)
      return null

    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/auth/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok)
        return null

      const data = await res.json() as AuthMeResponseDto
      return data.user
    }
    catch {
      return null
    }
  },

  async logout(): Promise<void> {
    // Revoke refresh token on backend (best effort — does not block UI logout)
    const refreshToken = ssGet(SS_REFRESH)
    if (refreshToken) {
      fetch(`${getApiBaseUrl()}/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {})
    }

    ssClear()
    await syncServerSessionCookie(null)
    _isAuthenticated = false
    _lastSyncedAccessToken = null
    _getToken = null

    if (_logout && typeof window !== 'undefined') {
      _logout({ logoutParams: { returnTo: window.location.origin } })
    }
  },
}
