import { authService, initAuthService } from './auth-service'

describe('authService (Auth0 adapter)', () => {
  const mockGetToken = jest.fn()
  const mockLogout = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to uninitialized state between tests
    initAuthService(mockGetToken, mockLogout, false)
  })

  describe('before initAuthService', () => {
    it('getAccessToken returns null when not initialized', async () => {
      // Re-import to get fresh module state
      initAuthService(() => Promise.reject(new Error('not init')), mockLogout, false)
      const { authService: freshService } = await import('./auth-service')
      const token = await freshService.getAccessToken()
      expect(token).toBeNull()
    })

    it('isAuthenticated returns false when not initialized', () => {
      initAuthService(mockGetToken, mockLogout, false)
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('getRefreshToken returns null when not authenticated', () => {
      initAuthService(mockGetToken, mockLogout, false)
      expect(authService.getRefreshToken()).toBeNull()
    })
  })

  describe('after initAuthService with isAuthenticated=true', () => {
    beforeEach(() => {
      initAuthService(mockGetToken, mockLogout, true)
    })

    it('getAccessToken returns token from Auth0', async () => {
      mockGetToken.mockResolvedValue('test-access-token')

      const token = await authService.getAccessToken()

      expect(token).toBe('test-access-token')
      expect(mockGetToken).toHaveBeenCalledTimes(1)
    })

    it('getAccessToken returns null when Auth0 throws', async () => {
      mockGetToken.mockRejectedValue(new Error('Login required'))

      const token = await authService.getAccessToken()

      expect(token).toBeNull()
    })

    it('isAuthenticated returns true', () => {
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('getRefreshToken returns sentinel (non-null) when authenticated', () => {
      expect(authService.getRefreshToken()).not.toBeNull()
    })

    it('refresh delegates to getAccessToken', async () => {
      mockGetToken.mockResolvedValue('refreshed-token')

      const result = await authService.refresh()

      expect(result?.accessToken).toBe('refreshed-token')
    })

    it('refresh returns null when Auth0 token retrieval fails', async () => {
      mockGetToken.mockRejectedValue(new Error('Consent required'))

      const result = await authService.refresh()

      // getAccessToken returns null → refresh returns null (not {accessToken:null})
      expect(result).toBeNull()
    })

    it('logout calls Auth0 logout with returnTo and clears state', async () => {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { location: { origin: 'https://staff.salud-de-una.com' } },
      })

      await authService.logout()

      expect(mockLogout).toHaveBeenCalledWith({
        logoutParams: { returnTo: 'https://staff.salud-de-una.com' },
      })
      expect(authService.isAuthenticated()).toBe(false)
    })
  })
})
