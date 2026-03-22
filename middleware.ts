import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ROLE_CLAIM = 'role'
const ROLE_USER_COOKIE = 'salud-de-una.user'

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

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return atob(padded)
}

function getRoleFromAuthorization(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authorization.slice(7)
    const payload = token.split('.')[1]
    if (!payload) {
      return null
    }

    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>
    const role = decodedPayload[ROLE_CLAIM]
    return typeof role === 'string' ? role : null
  }
  catch {
    return null
  }
}

function getRoleFromUserCookie(request: NextRequest) {
  const userCookie = request.cookies.get(ROLE_USER_COOKIE)?.value
  if (!userCookie) {
    return null
  }

  try {
    const decoded = decodeURIComponent(userCookie)
    const userPayload = JSON.parse(decoded) as Record<string, unknown>
    const role = userPayload[ROLE_CLAIM]
    return typeof role === 'string' ? role : null
  }
  catch {
    return null
  }
}

function resolveRequestRole(request: NextRequest) {
  return getRoleFromAuthorization(request) ?? getRoleFromUserCookie(request)
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const role = resolveRequestRole(req)

    if (role && role !== 'ADMIN') {
      const forbiddenUrl = new URL('/403', req.url)
      return NextResponse.redirect(forbiddenUrl)
    }
  }

  const next = NextResponse.next()
  applySecurityHeaders(next)
  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
