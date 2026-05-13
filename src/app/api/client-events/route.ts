import { NextResponse } from 'next/server'

const SENSITIVE_KEY_PATTERN = /token|password|secret|email|content|message|summary|answer|chat|patient|doctor|fullName|firstName|lastName/i

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, 20).map(sanitize)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, current]) => {
        acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitize(current)
        return acc
      },
      {},
    )
  }

  if (typeof value === 'string' && value.length > 240) {
    return `${value.slice(0, 240)}...`
  }

  return value
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const userAgent = req.headers.get('user-agent') ?? undefined

  const event = {
    timestamp: new Date().toISOString(),
    service: 'salud-de-una-web',
    userAgent,
    level: typeof body?.level === 'string' ? body.level : 'info',
    message: typeof body?.message === 'string' ? body.message.slice(0, 180) : 'client-event',
    path: typeof body?.path === 'string' ? body.path : undefined,
    correlationId: typeof body?.correlationId === 'string' ? body.correlationId : undefined,
    status: typeof body?.status === 'number' ? body.status : undefined,
    userRole: typeof body?.userRole === 'string' ? body.userRole : undefined,
    component: typeof body?.component === 'string' ? body.component : undefined,
    metadata: sanitize(body?.metadata),
  }

  console.warn(JSON.stringify(event))

  return NextResponse.json({ accepted: true })
}
