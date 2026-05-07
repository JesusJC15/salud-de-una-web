import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'salud-de-una.access-token'

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
  const apiOrigin = trimTrailingSlashes(process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
  res.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      `worker-src blob: 'self'`,
      `style-src 'self' 'unsafe-inline'`,
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
): Promise<{ role: string } | null> {
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

    if (!response.ok)
      return null

    const payload = await response.json() as { user?: { role?: string } }
    return payload.user?.role ? { role: payload.user.role } : null
  }
  catch {
    return null
  }
  finally {
    clearTimeout(timeoutId)
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const apiBaseUrl = trimTrailingSlashes(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000')

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

    const user = await validateToken(accessToken, apiBaseUrl)

    if (!user) {
      // Token expired or network error — clear cookie and send to login
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

    if (user.role !== 'DOCTOR') {
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

    const user = await validateToken(accessToken, apiBaseUrl)

    if (!user) {
      // Token expired or network error — clear cookie and send to login
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

    if (user.role !== 'ADMIN') {
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
