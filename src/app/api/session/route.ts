import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'salud-de-una.access-token'

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { accessToken?: string } | null
  const accessToken = body?.accessToken?.trim()

  if (!accessToken) {
    return NextResponse.json(
      { message: 'accessToken es requerido' },
      { status: 400 },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, buildCookieOptions())

  return NextResponse.json({ synced: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
    ...buildCookieOptions(),
    maxAge: 0,
  })

  return NextResponse.json({ cleared: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    return new Response(null, { status: 204 })
  }

  return NextResponse.json({ accessToken })
}
