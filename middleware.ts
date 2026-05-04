import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

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
  res.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: ${auth0Origin}; frame-src ${auth0Origin}; frame-ancestors 'none';`,
  )
}

export async function middleware(req: NextRequest) {
  void req
  const next = NextResponse.next()
  applySecurityHeaders(next)
  return next
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
