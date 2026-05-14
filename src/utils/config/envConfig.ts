interface EnvConfig {
  env: string
  backendOrigin: string
  baseUrl: string
  apiBaseUrl: string
  socketBaseUrl: string
  localStorageKeys: {
    refreshToken: string
    user: string
  }
}

const API_PREFIX = '/v1'

function trimTrailingSlashes(url: string): string {
  let end = String(url || '').length
  const str = String(url || '')
  while (end > 0 && str[end - 1] === '/') end--
  return end === str.length ? str : str.slice(0, end)
}

function normalizeBaseUrl(value: string): string {
  return trimTrailingSlashes(value)
}

function stripApiPrefix(value: string): string {
  const normalized = normalizeBaseUrl(value)
  return normalized.endsWith(API_PREFIX)
    ? normalized.slice(0, -API_PREFIX.length)
    : normalized
}

// process.env.NEXT_PUBLIC_* is inlined at build time by Next.js for both
// server and client bundles. Using `import { env } from 'node:process'`
// bypasses that inlining and resolves to undefined in browser bundles.
const backendOrigin = stripApiPrefix(
  process.env.NEXT_PUBLIC_API_BASE_URL
  || 'http://localhost:3000',
)

const config: EnvConfig = {
  env: process.env.NODE_ENV ?? 'development',
  backendOrigin,
  baseUrl: backendOrigin,
  apiBaseUrl: `${backendOrigin}${API_PREFIX}`,
  socketBaseUrl: backendOrigin,
  localStorageKeys: {
    refreshToken: 'salud-de-una.refresh-token',
    user: 'salud-de-una.user',
  },
}

export default config
