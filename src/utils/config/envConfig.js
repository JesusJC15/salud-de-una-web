import { env } from 'node:process'

const TRAILING_SLASHES_PATTERN = /\/+$/g
const API_PREFIX = '/v1'

function normalizeBaseUrl(value) {
  return String(value || '').replace(TRAILING_SLASHES_PATTERN, '')
}

const backendOrigin = normalizeBaseUrl(
  env.NEXT_PUBLIC_API_BASE_URL
  || 'http://localhost:3000',
)

const config = {
  env: env.NODE_ENV ?? 'development',
  backendOrigin,
  baseUrl: backendOrigin,
  apiBaseUrl: `${backendOrigin}${API_PREFIX}`,
  localStorageKeys: {
    refreshToken: 'salud-de-una.refresh-token',
    user: 'salud-de-una.user',
  },
}

export default config
