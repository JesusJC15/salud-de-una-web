/* eslint-disable node/prefer-global/process */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type AppUserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN'

interface JwtPayload {
  sub?: string
  role?: AppUserRole | string
  email?: string
  exp?: number
  iat?: number
  tokenType?: 'access' | 'refresh' | string
}

interface AuthSessionResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: AppUserRole | string
  }
}

const BASE64URL_DASH_PATTERN = /-/g
const BASE64URL_UNDERSCORE_PATTERN = /_/g
const TRAILING_SLASHES_PATTERN = /\/+$/g

const ACCESS_COOKIE_KEYS = ['salud-de-una.access-token', 'accessToken'] as const
const REFRESH_COOKIE_KEYS = ['salud-de-una.refresh-token', 'refreshToken'] as const

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/unauthorized',
] as const
const PROTECTED_PREFIXES = [
  '/app',
  '/home',
  '/doctors',
  '/patients',
  '/admin',
  '/admins',
] as const

const ROLE_GUARDS: ReadonlyArray<{ prefix: string, allowedRoles: AppUserRole[] }> = [
  { prefix: '/admin', allowedRoles: ['ADMIN'] },
  { prefix: '/admins', allowedRoles: ['ADMIN'] },
  { prefix: '/doctors', allowedRoles: ['DOCTOR', 'ADMIN'] },
  {
    prefix: '/patients',
    allowedRoles: [
      'PATIENT',
      'ADMIN',
      'DOCTOR',
    ],
  },
]

const STATIC_PREFIXES = [
  '/_next',
  '/api',
  '/favicon',
  '/assets',
  '/public',
] as const
const STATIC_EXACT_PATHS = [
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
] as const

function stripTrailingSlash(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function isPrefixMatch(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(path => isPrefixMatch(pathname, path))
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(path => isPrefixMatch(pathname, path))
}

function isStaticOrInternal(pathname: string) {
  if (STATIC_EXACT_PATHS.includes(pathname as (typeof STATIC_EXACT_PATHS)[number])) {
    return true
  }

  return STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

function getCookieValue(req: NextRequest, keys: readonly string[]) {
  for (const key of keys) {
    const value = req.cookies.get(key)?.value
    if (value) {
      return value
    }
  }

  return null
}

function decodeBase64Url(value: string) {
  const normalized = value
    .replace(BASE64URL_DASH_PATTERN, '+')
    .replace(BASE64URL_UNDERSCORE_PATTERN, '/')
  const padLength = (4 - (normalized.length % 4)) % 4
  const padded = `${normalized}${'='.repeat(padLength)}`
  return atob(padded)
}

function parseJwt(token: string | null): JwtPayload | null {
  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = decodeBase64Url(parts[1])
    return JSON.parse(payload) as JwtPayload
  }
  catch {
    return null
  }
}

function isTokenExpired(payload: JwtPayload | null) {
  if (!payload?.exp) {
    return true
  }

  return payload.exp * 1000 <= Date.now()
}

function getApiBaseUrl() {
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  return rawBase.replace(TRAILING_SLASHES_PATTERN, '')
}

async function refreshSession(refreshToken: string): Promise<AuthSessionResponse | null> {
  const apiBaseUrl = getApiBaseUrl()
  if (!apiBaseUrl) {
    return null
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      return null
    }

    return await response.json() as AuthSessionResponse
  }
  catch {
    return null
  }
}

function getRequiredRoles(pathname: string): AppUserRole[] | null {
  const guard = ROLE_GUARDS.find(item => isPrefixMatch(pathname, item.prefix))
  return guard?.allowedRoles ?? null
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'same-origin')
  res.headers.set('Permissions-Policy', 'interest-cohort=(), camera=(), microphone=(), geolocation=()')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.headers.set(
    'Content-Security-Policy',
    'default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' data:; connect-src \'self\' http: https:; frame-ancestors \'none\';',
  )
}

function buildLoginRedirect(req: NextRequest) {
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = '/'
  redirectUrl.searchParams.set('from', req.nextUrl.pathname)
  redirectUrl.searchParams.set('reason', 'auth-required')
  return NextResponse.redirect(redirectUrl)
}

function buildUnauthorizedRedirect(req: NextRequest) {
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = '/unauthorized'
  return NextResponse.redirect(redirectUrl)
}

function clearAuthCookies(res: NextResponse) {
  for (const key of ACCESS_COOKIE_KEYS) {
    res.cookies.delete(key)
  }

  for (const key of REFRESH_COOKIE_KEYS) {
    res.cookies.delete(key)
  }
}

function setAuthCookies(res: NextResponse, session: AuthSessionResponse) {
  const secure = process.env.NODE_ENV === 'production'
  const accessPayload = parseJwt(session.accessToken)
  const refreshPayload = parseJwt(session.refreshToken)

  const accessMaxAge = accessPayload?.exp
    ? Math.max(1, Math.floor(accessPayload.exp - Date.now() / 1000))
    : 3600

  const refreshMaxAge = refreshPayload?.exp
    ? Math.max(1, Math.floor(refreshPayload.exp - Date.now() / 1000))
    : 60 * 60 * 24 * 7

  res.cookies.set(ACCESS_COOKIE_KEYS[0], session.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: accessMaxAge,
  })

  res.cookies.set(REFRESH_COOKIE_KEYS[0], session.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: refreshMaxAge,
  })
}

function buildContinueResponse(req: NextRequest, accessToken: string) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('authorization', `Bearer ${accessToken}`)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export async function middleware(req: NextRequest) {
  const pathname = stripTrailingSlash(req.nextUrl.pathname)

  if (isStaticOrInternal(pathname)) {
    const passthrough = NextResponse.next()
    applySecurityHeaders(passthrough)
    return passthrough
  }

  const protectedPath = isProtectedPath(pathname)
  const isPublic = isPublicPath(pathname)

  if (!protectedPath && isPublic) {
    const passthrough = NextResponse.next()
    applySecurityHeaders(passthrough)
    return passthrough
  }

  if (!protectedPath) {
    const passthrough = NextResponse.next()
    applySecurityHeaders(passthrough)
    return passthrough
  }

  const refreshToken = getCookieValue(req, REFRESH_COOKIE_KEYS)
  let accessToken = getCookieValue(req, ACCESS_COOKIE_KEYS)
  let accessPayload = parseJwt(accessToken)

  if (accessPayload?.tokenType === 'refresh') {
    accessToken = null
    accessPayload = null
  }

  if (!accessToken || isTokenExpired(accessPayload)) {
    if (!refreshToken) {
      const redirect = buildLoginRedirect(req)
      clearAuthCookies(redirect)
      applySecurityHeaders(redirect)
      return redirect
    }

    const session = await refreshSession(refreshToken)
    if (!session?.accessToken || !session.refreshToken) {
      const redirect = buildLoginRedirect(req)
      clearAuthCookies(redirect)
      applySecurityHeaders(redirect)
      return redirect
    }

    accessToken = session.accessToken
    accessPayload = parseJwt(session.accessToken)

    const next = buildContinueResponse(req, session.accessToken)
    setAuthCookies(next, session)

    const requiredRoles = getRequiredRoles(pathname)
    if (requiredRoles && (!accessPayload?.role || !requiredRoles.includes(accessPayload.role as AppUserRole))) {
      const unauthorized = buildUnauthorizedRedirect(req)
      applySecurityHeaders(unauthorized)
      return unauthorized
    }

    applySecurityHeaders(next)
    return next
  }

  const requiredRoles = getRequiredRoles(pathname)
  if (requiredRoles && (!accessPayload?.role || !requiredRoles.includes(accessPayload.role as AppUserRole))) {
    const unauthorized = buildUnauthorizedRedirect(req)
    applySecurityHeaders(unauthorized)
    return unauthorized
  }

  const next = buildContinueResponse(req, accessToken)
  applySecurityHeaders(next)
  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
