import type { NextRequest } from 'next/server'
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'salud-de-una.access-token'
const CLAIM_NS = 'https://salud-de-una.com/'

// Auth0 JWKS set — cached internally by jose, re-fetched only on key rotation
const getAuth0Jwks = (() => {
  let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
  return () => {
    const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN
    if (!domain)
      return null
    if (!jwks) {
      jwks = createRemoteJWKSet(
        new URL(`https://${domain}/.well-known/jwks.json`),
      )
    }
    return jwks
  }
})()

function trimTrailingSlashes(url: string): string {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') end--
  return end === url.length ? url : url.slice(0, end)
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'same-origin')
  res.headers.set('Permissions-Policy', 'interest-cohort=(), camera=(), microphone=(), geolocation=()')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? ''
  const auth0Origin = auth0Domain ? `https://${auth0Domain}` : ''
  const apiOrigin = trimTrailingSlashes(
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/v1$/, ''),
  )
  res.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      // Next.js App Router emits inline bootstrap scripts during SSR hydration.
      `script-src 'self' 'unsafe-inline' https:`,
      `worker-src blob: 'self'`,
      `style-src 'self' 'unsafe-inline' https:`,
      `img-src 'self' data: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' https: wss: ${apiOrigin} ${auth0Origin}`,
      `frame-src ${auth0Origin}`,
      `frame-ancestors 'none'`,
    ].join('; '),
  )
}

async function validateTokenViaBackend(
  token: string,
  apiBaseUrl: string,
): Promise<{ kind: 'valid', role: string } | { kind: 'invalid' } | { kind: 'unavailable' }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/me`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) {
      return response.status === 401 || response.status === 403
        ? { kind: 'invalid' }
        : { kind: 'unavailable' }
    }
    const payload = await response.json() as { user?: { role?: string } }
    return payload.user?.role
      ? { kind: 'valid', role: payload.user.role }
      : { kind: 'invalid' }
  }
  catch {
    return { kind: 'unavailable' }
  }
  finally {
    clearTimeout(timeoutId)
  }
}

// ── Local JWT verification: Auth0 RS256 + legacy HS256 ────────────────────────

async function verifyAuth0Token(token: string): Promise<string | null> {
  const jwks = getAuth0Jwks()
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE
  if (!jwks || !domain)
    return null
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://${domain}/`,
      audience,
    })
    return (payload[`${CLAIM_NS}role`] as string) ?? null
  }
  catch {
    return null
  }
}

async function verifyLegacyToken(token: string): Promise<string | null> {
  const secret = process.env.JWT_SECRET
  if (!secret)
    return null
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] },
    )
    return (payload.role as string) ?? null
  }
  catch {
    return null
  }
}

async function validateTokenLocally(
  token: string,
): Promise<{ kind: 'valid', role: string } | { kind: 'invalid' } | { kind: 'needs_backend' }> {
  // Quick expiry check before attempting crypto — decodeJwt is pure base64, no network
  try {
    const { exp } = decodeJwt(token)
    if (exp && exp * 1000 < Date.now())
      return { kind: 'invalid' }
  }
  catch {
    // Not a decodable JWT — cannot verify locally
    return { kind: 'needs_backend' }
  }

  // Try Auth0 RS256 via public JWKS — works in all environments
  const auth0Role = await verifyAuth0Token(token)
  if (auth0Role)
    return { kind: 'valid', role: auth0Role }

  // Try legacy HS256 with shared secret — requires JWT_SECRET env var
  if (process.env.JWT_SECRET) {
    const legacyRole = await verifyLegacyToken(token)
    if (legacyRole)
      return { kind: 'valid', role: legacyRole }
    // JWT_SECRET is set but token didn't verify → definitively invalid
    return { kind: 'invalid' }
  }

  // JWT_SECRET not configured (e.g. Vercel without the env var):
  // delegate to the backend — it knows the secret
  return { kind: 'needs_backend' }
}

function redirectToLogin(req: NextRequest, pathname: string, clearCookie = false) {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', pathname)
  const redirect = NextResponse.redirect(loginUrl)
  if (clearCookie) {
    redirect.cookies.set(ACCESS_TOKEN_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
  }
  applySecurityHeaders(redirect)
  return redirect
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = pathname.startsWith('/doctor') || pathname.startsWith('/admin')
  if (!isProtected) {
    const next = NextResponse.next()
    applySecurityHeaders(next)
    return next
  }

  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim()
  if (!accessToken) {
    return redirectToLogin(req, pathname)
  }

  const isE2EMode = process.env.NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK === 'true'
  const apiBaseUrl = trimTrailingSlashes(
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/v1$/, ''),
  )

  let validation: Awaited<ReturnType<typeof validateTokenViaBackend>>

  if (isE2EMode) {
    // E2E mock: tokens are not real JWTs — delegate to mock backend
    const result = await validateTokenViaBackend(accessToken, apiBaseUrl)
    if (result.kind === 'unavailable') {
      const next = NextResponse.next()
      applySecurityHeaders(next)
      return next
    }
    validation = result
  }
  else {
    const localResult = await validateTokenLocally(accessToken)

    if (localResult.kind === 'needs_backend') {
      // JWT_SECRET not configured — fall back to backend call (legacy tokens in Vercel
      // without JWT_SECRET, or any other environment where the secret is unavailable)
      const backendResult = await validateTokenViaBackend(accessToken, apiBaseUrl)
      if (backendResult.kind === 'unavailable') {
        const next = NextResponse.next()
        applySecurityHeaders(next)
        return next
      }
      validation = backendResult
    }
    else {
      validation = localResult
    }
  }

  if (validation.kind === 'invalid') {
    return redirectToLogin(req, pathname, true)
  }

  const { role } = validation as { kind: 'valid', role: string }

  // Role-based routing
  if (pathname.startsWith('/doctor') && role !== 'DOCTOR') {
    const redirect = NextResponse.redirect(new URL('/dashboard', req.url))
    applySecurityHeaders(redirect)
    return redirect
  }

  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    const redirect = NextResponse.redirect(new URL('/dashboard', req.url))
    applySecurityHeaders(redirect)
    return redirect
  }

  const next = NextResponse.next()
  applySecurityHeaders(next)
  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
