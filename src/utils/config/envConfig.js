import { env } from 'node:process'

const API_PREFIX = '/v1'

function trimTrailingSlashes(url) {
  let end = String(url || '').length
  const str = String(url || '')
  while (end > 0 && str[end - 1] === '/') end--
  return end === str.length ? str : str.slice(0, end)
}

function normalizeBaseUrl(value) {
  return trimTrailingSlashes(value)
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
