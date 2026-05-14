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
): Promise<{ kind: 'valid', role: string } | { kind: 'invalid' }> {
  // Quick expiry check before attempting crypto — avoids JWKS fetch for expired tokens
  try {
    const { exp } = decodeJwt(token)
    if (exp && exp * 1000 < Date.now())
      return { kind: 'invalid' }
  }
  catch {
    return { kind: 'invalid' }
  }

  const role = await verifyAuth0Token(token) ?? await verifyLegacyToken(token)
  return role ? { kind: 'valid', role } : { kind: 'invalid' }
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

  const validation = await validateTokenLocally(accessToken)

  if (validation.kind === 'invalid') {
    return redirectToLogin(req, pathname, true)
  }

  // Role-based routing
  if (pathname.startsWith('/doctor') && validation.role !== 'DOCTOR') {
    const redirect = NextResponse.redirect(new URL('/dashboard', req.url))
    applySecurityHeaders(redirect)
    return redirect
  }

  if (pathname.startsWith('/admin') && validation.role !== 'ADMIN') {
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
