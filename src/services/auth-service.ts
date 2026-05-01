// Auth0 adapter — replaces the old custom JWT auth-service.
// api-client.ts calls this; Auth0Provider initializes it via initAuthService().

type GetTokenFn = () => Promise<string>
type LogoutFn = (options: { logoutParams: { returnTo: string } }) => void

let _getToken: GetTokenFn | null = null
let _logout: LogoutFn | null = null
let _isAuthenticated = false

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
  // Returns Auth0 access token (silently refreshes if expired).
  async getAccessToken(): Promise<string | null> {
    if (!_getToken)
      return null
    try {
      return await _getToken()
    }
    catch {
      return null
    }
  },

  // Kept for api-client.ts 401 retry logic — delegates to getAccessToken().
  async refresh(): Promise<{ accessToken: string | null } | null> {
    const token = await this.getAccessToken()
    return token ? { accessToken: token } : null
  },

  // Returns non-null sentinel when authenticated so api-client can distinguish
  // "not authenticated" from "need to refresh" in resolveAccessToken.
  getRefreshToken(): string | null {
    return _isAuthenticated ? '__auth0_managed__' : null
  },

  isAuthenticated(): boolean {
    return _isAuthenticated
  },

  async logout(): Promise<void> {
    _isAuthenticated = false
    _getToken = null
    if (_logout && typeof window !== 'undefined') {
      _logout({ logoutParams: { returnTo: window.location.origin } })
    }
  },
}
