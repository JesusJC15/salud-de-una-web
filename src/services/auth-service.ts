// Auth0 adapter — replaces the old custom JWT auth-service.
// api-client.ts calls this; Auth0Provider initializes it via initAuthService().
// Also supports legacy JWT sessions (staff email+password login during cutover).

type GetTokenFn = () => Promise<string>
type LogoutFn = (options: { logoutParams: { returnTo: string } }) => void

let _getToken: GetTokenFn | null = null
let _logout: LogoutFn | null = null
let _isAuthenticated = false

// Legacy JWT session (staff email+password login)
const SS_ACCESS = 'salud-de-una.legacy.access'
const SS_REFRESH = 'salud-de-una.legacy.refresh'
const TRAILING_SLASH = /\/+$/

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
  // Initializes a legacy JWT session (staff email+password login).
  initLegacySession(accessToken: string, refreshToken: string): void {
    ssSet(SS_ACCESS, accessToken)
    ssSet(SS_REFRESH, refreshToken)
  },

  // Returns Auth0 access token, or legacy JWT if not on Auth0.
  async getAccessToken(): Promise<string | null> {
    if (_getToken) {
      try {
        const token = await _getToken()
        if (token)
          return token
      }
      catch {
        // fall through to legacy
      }
    }
    return ssGet(SS_ACCESS)
  },

  // Kept for api-client.ts 401 retry logic.
  async refresh(): Promise<{ accessToken: string | null } | null> {
    if (_getToken) {
      const token = await this.getAccessToken()
      if (token)
        return { accessToken: token }
    }

    const refreshToken = ssGet(SS_REFRESH)
    if (!refreshToken)
      return null

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000').replace(TRAILING_SLASH, '')
      const res = await fetch(`${baseUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        ssClear()
        return null
      }
      const data = await res.json() as { accessToken: string, refreshToken?: string }
      ssSet(SS_ACCESS, data.accessToken)
      // Keep the existing refresh token if the backend doesn't return a new one
      ssSet(SS_REFRESH, data.refreshToken ?? refreshToken)
      return { accessToken: data.accessToken }
    }
    catch {
      ssClear()
      return null
    }
  },

  // Returns non-null sentinel when authenticated so api-client can distinguish
  // "not authenticated" from "need to refresh" in resolveAccessToken.
  getRefreshToken(): string | null {
    if (_isAuthenticated)
      return '__auth0_managed__'
    return ssGet(SS_REFRESH)
  },

  isAuthenticated(): boolean {
    return _isAuthenticated || ssGet(SS_ACCESS) !== null
  },

  async logout(): Promise<void> {
    ssClear()
    _isAuthenticated = false
    _getToken = null
    if (_logout && typeof window !== 'undefined') {
      _logout({ logoutParams: { returnTo: window.location.origin } })
    }
  },
}
