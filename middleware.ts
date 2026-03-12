import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Rutas que deben protegerse (puedes ajustar según necesites)
const PROTECTED_PATHS = [
  '/doctors',
  '/patients',
  '/admin',
  '/home',
  '/app',
]

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

function isExpired(token: any) {
  if (!token)
    return true

  try {
    const parts = token.split('.')
    if (parts && parts.length === 3) {
      // atob is available in the Edge runtime
      const raw = atob(parts[1])
      const payload = JSON.parse(raw)
      if (payload.exp) {
        return payload.exp * 1000 <= Date.now()
      }
    }
  }
  catch {
    return true
  }
  return true
}

async function attemptRefresh(refreshToken: any) {
  if (!refreshToken)
    return null

  const tokenUrl = `${process.env.NEXT_PUBLIC_AUTHENTICATION_API_URL}/realms/${process.env.NEXT_PUBLIC_AUTHENTICATION_REALM}/protocol/openid-connect/token`

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.NEXT_PUBLIC_CLIENT_ID ?? '',
    client_secret: process.env.NEXT_PUBLIC_CLIENT_SECRET ?? '',
    refresh_token: refreshToken,
  })

  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok)
      return null

    return await res.json()
  }
  catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const protectedPath = isProtected(pathname)

  // Skip public assets, API routes and Next internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon') || pathname.startsWith('/assets') || pathname.startsWith('/public')) {
    return NextResponse.next()
  }

  if (!protectedPath) {
    return NextResponse.next()
  }

  const refreshToken = req.cookies.get('refreshToken')?.value

  if (!refreshToken) {
    // No refresh token -> redirect to login
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isExpired(refreshToken)) {
    // Refresh token expired -> redirect to login
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const newSession = await attemptRefresh(refreshToken)

  if (newSession) {
    const requestHeaders = new Headers(req.headers)
    if (newSession.access_token)
      requestHeaders.set('authorization', `Bearer ${newSession.access_token}`)

    const res = NextResponse.next({ request: { headers: requestHeaders } })

    // Update refresh token cookie if a new one was provided
    if (newSession.refresh_token) {
      try {
        const secure = process.env.NODE_ENV === 'production'
        res.cookies.set('refreshToken', newSession.refresh_token, {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          secure,
          maxAge: Number(newSession.refresh_expires_in) || 2592000, // 30 days default
        })
      }
      catch {
        // ignore cookie set errors
      }
    }

    // security headers
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'no-referrer')
    res.headers.set('Permissions-Policy', 'interest-cohort=()')
    return res
  }

  // refresh failed -> redirect to login
  const loginUrl = new URL('/', req.url)
  loginUrl.searchParams.set('from', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/doctors/:path*',
    '/patients/:path*',
    '/admins/:path*',
    '/home/:path*',
    '/app/:path*',
  ],
}