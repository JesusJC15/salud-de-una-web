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

// process.env.NEXT_PUBLIC_* is inlined at build time by Next.js for both
// server and client bundles. Using `import { env } from 'node:process'`
// bypasses that inlining and resolves to undefined in browser bundles.
const backendOrigin = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL
  || 'http://localhost:3000',
)

const config = {
  env: process.env.NODE_ENV ?? 'development',
  backendOrigin,
  baseUrl: backendOrigin,
  apiBaseUrl: `${backendOrigin}${API_PREFIX}`,
  localStorageKeys: {
    refreshToken: 'salud-de-una.refresh-token',
    user: 'salud-de-una.user',
  },
}

export default config
