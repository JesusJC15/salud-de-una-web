import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'salud-de-una.access-token'

function trimTrailingSlashes(url: string): string {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') end--
  return end === url.length ? url : url.slice(0, end)
}

function normalizeBackendOrigin(value: string): string {
  const normalized = trimTrailingSlashes(value)
  return normalized.endsWith('/v1') ? normalized.slice(0, -3) : normalized
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
  const apiOrigin = normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
  res.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      `script-src 'self' https:`,
      `worker-src blob: 'self'`,
      `style-src 'self' https:`,
      `img-src 'self' data: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' https: wss: ${apiOrigin} ${auth0Origin}`,
      `frame-src ${auth0Origin}`,
      `frame-ancestors 'none'`,
    ].join('; '),
  )
}

async function validateToken(
  accessToken: string,
  apiBaseUrl: string,
): Promise<{ kind: 'valid', role: string } | { kind: 'invalid' } | { kind: 'unavailable' }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { kind: 'invalid' }
      }

      return { kind: 'unavailable' }
    }

    const payload = await response.json() as { user?: { role?: string } }
    return payload.user?.role ? { kind: 'valid', role: payload.user.role } : { kind: 'invalid' }
  }
  catch {
    return { kind: 'unavailable' }
  }
  finally {
    clearTimeout(timeoutId)
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const backendOrigin = normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000')

  // ── Doctor route protection ──────────────────────────────────────────────
  if (pathname.startsWith('/doctor')) {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim()

    if (!accessToken) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      const redirect = NextResponse.redirect(loginUrl)
      applySecurityHeaders(redirect)
      return redirect
    }

    const validation = await validateToken(accessToken, backendOrigin)

    if (validation.kind === 'invalid') {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      const redirect = NextResponse.redirect(loginUrl)
      redirect.cookies.set(ACCESS_TOKEN_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      })
      applySecurityHeaders(redirect)
      return redirect
    }

    if (validation.kind === 'unavailable') {
      const next = NextResponse.next()
      applySecurityHeaders(next)
      return next
    }

    if (validation.role !== 'DOCTOR') {
      const redirect = NextResponse.redirect(new URL('/dashboard', req.url))
      applySecurityHeaders(redirect)
      return redirect
    }
  }

  // ── Admin route protection ───────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim()

    if (!accessToken) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      const redirect = NextResponse.redirect(loginUrl)
      applySecurityHeaders(redirect)
      return redirect
    }

    const validation = await validateToken(accessToken, backendOrigin)

    if (validation.kind === 'invalid') {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      const redirect = NextResponse.redirect(loginUrl)
      redirect.cookies.set(ACCESS_TOKEN_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      })
      applySecurityHeaders(redirect)
      return redirect
    }

    if (validation.kind === 'unavailable') {
      const next = NextResponse.next()
      applySecurityHeaders(next)
      return next
    }

    if (validation.role !== 'ADMIN') {
      const redirect = NextResponse.redirect(new URL('/dashboard', req.url))
      applySecurityHeaders(redirect)
      return redirect
    }
  }

  const next = NextResponse.next()
  applySecurityHeaders(next)
  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
