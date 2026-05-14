import { NextResponse } from 'next/server'

interface RouteContext { params: Promise<{ path: string[] }> }

const now = new Date().toISOString()

function isEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK === 'true'
}

function forbidden() {
  return NextResponse.json({ message: 'E2E backend mock disabled' }, { status: 404 })
}

function userFromRequest(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (auth.includes('admin-token')) {
    return { id: 'admin-1', email: 'admin@saluddeuna.test', role: 'ADMIN', isActive: true }
  }
  if (auth.includes('doctor-token')) {
    return { id: 'doctor-1', email: 'doctor@saluddeuna.test', role: 'DOCTOR', isActive: true }
  }
  return null
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'x-correlation-id': 'e2e-correlation-id' },
  })
}

async function handle(req: Request, context: RouteContext) {
  if (!isEnabled())
    return forbidden()

  const path = (await context.params).path.join('/')
  const method = req.method

  if (method === 'POST' && path === 'v1/auth/staff/login') {
    const body = await req.json().catch(() => ({})) as { email?: string }
    const isAdmin = body.email?.includes('admin')
    return json({
      accessToken: isAdmin ? 'admin-token' : 'doctor-token',
      refreshToken: isAdmin ? 'admin-refresh' : 'doctor-refresh',
      user: {
        id: isAdmin ? 'admin-1' : 'doctor-1',
        email: body.email,
        role: isAdmin ? 'ADMIN' : 'DOCTOR',
      },
    })
  }

  if (method === 'GET' && path === 'v1/auth/me') {
    const user = userFromRequest(req)
    return user ? json({ user }) : json({ message: 'No autorizado' }, 401)
  }

  if (method === 'GET' && path === 'v1/dashboard/business') {
    return json({
      generatedAt: now,
      kpis: { totalPatients: 12, totalDoctors: 3, verifiedDoctors: 2, pendingDoctors: 1 },
      doctorStatusBreakdown: { verified: 2, pending: 1, rejected: 0 },
      growthLast7Days: { patients: 2, doctors: 1 },
      operationalSignals: { unreadNotifications: 0, verificationCoverage: 66 },
      productKpis: [],
    })
  }

  if (method === 'GET' && path === 'v1/dashboard/technical') {
    return json({ sampleSize: 10, p95LatencyMs: 120, errorRate: 0, timestamp: now, source: 'memory', degraded: false })
  }

  if (method === 'GET' && path === 'v1/dashboard/consultations') {
    return json({
      generatedAt: now,
      statusBreakdown: { pending: 1, inAttention: 1, closed: 2 },
      totalConsultations: 4,
      closedLast7Days: 2,
      avgAttentionTimeMinutes: 18,
      slaCompliance: 95,
      bySpecialty: [{ specialty: 'GENERAL_MEDICINE', total: 4, closed: 2 }],
      topDoctors: [{ doctorId: 'doctor-1', name: 'Dra. Demo', specialty: 'GENERAL_MEDICINE', closed: 2 }],
    })
  }

  if (method === 'GET' && path === 'v1/dashboard/alerts') {
    return json({ generatedAt: now, items: [] })
  }

  if (method === 'GET' && path === 'v1/dashboard/ai-metrics') {
    return json({ windowHours: 24, total: 2, successCount: 2, errorCount: 0, successRate: 100, avgLatencyMs: 300, byPromptKey: {} })
  }

  if (method === 'GET' && path === 'v1/dashboard/errors') {
    return json([])
  }

  if (method === 'GET' && path === 'v1/billing/admin/revenue') {
    return json({ currentMonth: { totalRevenue: 120000, paidConsultations: 3, currency: 'COP' }, bySpecialty: [] })
  }

  if (method === 'GET' && path === 'v1/ready') {
    return json({
      status: 'ready',
      service: 'salud-de-una-api',
      timestamp: now,
      runtimeRole: 'api',
      checks: {
        database: { status: 'up', detail: 'ok' },
        redis: { status: 'up', detail: 'ok', latencyMs: 1, degraded: false },
        ai: { status: 'up', detail: 'ok', degraded: false },
      },
    })
  }

  if (method === 'GET' && path === 'v1/admin/doctors') {
    return json({
      summary: { total: 1, pending: 1, verified: 0, rejected: 0 },
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      items: [
        {
          id: '507f1f77bcf86cd799439011',
          firstName: 'Ana',
          lastName: 'Médica',
          email: 'ana@saluddeuna.test',
          specialty: 'GENERAL_MEDICINE',
          doctorStatus: 'PENDING',
          personalId: '123',
          phoneNumber: '3001234567',
          createdAt: now,
          updatedAt: now,
          latestVerification: null,
        },
      ],
    })
  }

  if (method === 'GET' && path === 'v1/admin/doctors/507f1f77bcf86cd799439011') {
    return json({
      id: '507f1f77bcf86cd799439011',
      firstName: 'Ana',
      lastName: 'Médica',
      email: 'ana@saluddeuna.test',
      specialty: 'GENERAL_MEDICINE',
      doctorStatus: 'PENDING',
      personalId: '123',
      phoneNumber: '3001234567',
      createdAt: now,
      updatedAt: now,
      latestVerification: null,
    })
  }

  if (method === 'POST' && path === 'v1/admin/doctors/507f1f77bcf86cd799439011/rethus-verify') {
    return json({ doctorId: '507f1f77bcf86cd799439011', doctorStatus: 'VERIFIED', checkedAt: now, verification: {} })
  }

  if (method === 'GET' && path === 'v1/consultations/queue') {
    return json({ items: [{ id: '507f1f77bcf86cd799439022', patientId: '507f1f77bcf86cd799439033', triageSessionId: 't1', specialty: 'GENERAL_MEDICINE', priority: 'HIGH', status: 'PENDING', createdAt: now }] })
  }

  if (method === 'PATCH' && path === 'v1/consultations/507f1f77bcf86cd799439022/assign') {
    return json({ id: '507f1f77bcf86cd799439022', status: 'IN_ATTENTION', assignedDoctorId: 'doctor-1', updatedAt: now })
  }

  if (method === 'GET' && path === 'v1/consultations/507f1f77bcf86cd799439022') {
    return json({
      id: '507f1f77bcf86cd799439022',
      patientId: '507f1f77bcf86cd799439033',
      triageSessionId: 't1',
      specialty: 'GENERAL_MEDICINE',
      priority: 'HIGH',
      status: 'IN_ATTENTION',
      assignedDoctorId: 'doctor-1',
      createdAt: now,
      triage: { status: 'COMPLETED', answers: [], analysis: { priority: 'HIGH', redFlags: [], aiSummary: 'Dolor agudo.' } },
    })
  }

  if (method === 'GET' && path === 'v1/consultations/507f1f77bcf86cd799439022/messages') {
    return json({ items: [], total: 0 })
  }

  if (method === 'GET' && path === 'v1/patients/507f1f77bcf86cd799439033/timeline') {
    return json({ items: [], nextCursor: null })
  }

  if (method === 'POST' && path === 'v1/consultations/507f1f77bcf86cd799439022/summary/generate') {
    return json({ consultationId: '507f1f77bcf86cd799439022', summary: 'Resumen clínico demo.', generatedAt: now, traceId: 'trace-1', citations: [] })
  }

  if (method === 'PATCH' && path === 'v1/consultations/507f1f77bcf86cd799439022/close') {
    return json({ id: '507f1f77bcf86cd799439022', status: 'CLOSED', closedAt: now })
  }

  if (method === 'GET' && path === 'v1/notifications/me') {
    return json({ items: [], unreadCount: 0 })
  }

  if (method === 'GET' && path === 'v1/doctors/me') {
    return json({
      id: 'doctor-1',
      firstName: 'Demo',
      lastName: 'Doctor',
      email: 'doctor@saluddeuna.test',
      specialty: 'GENERAL_MEDICINE',
      doctorStatus: 'VERIFIED',
      availabilityStatus: 'AVAILABLE',
    })
  }

  // ── Billing ──────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'v1/billing/admin/prices') {
    return json([
      { specialty: 'GENERAL_MEDICINE', amount: 30000, currency: 'COP', active: true },
      { specialty: 'ODONTOLOGY', amount: 50000, currency: 'COP', active: true },
      { specialty: 'URGENT_CARE', amount: 80000, currency: 'COP', active: true },
    ])
  }

  if (method === 'GET' && path === 'v1/billing/admin/transactions') {
    return json({ items: [], total: 0, page: 1, limit: 20 })
  }

  if (method === 'PATCH' && /^v1\/billing\/admin\/prices\//.test(path)) {
    return json({ specialty: path.split('/').pop(), amount: 35000, currency: 'COP', active: true })
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'v1/admin/reports/consultations.csv') {
    return new Response('id,specialty,priority,status,createdAt\ne2e-test-id,GENERAL_MEDICINE,HIGH,CLOSED,2024-01-01T00:00:00.000Z', {
      status: 200,
      headers: { 'Content-Type': 'text/csv', 'x-correlation-id': 'e2e-correlation-id' },
    })
  }

  // ── Admin users ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'v1/admin/users') {
    return json({ pagination: { page: 1, limit: 20, total: 0, totalPages: 1 }, items: [] })
  }

  // ── Knowledge ─────────────────────────────────────────────────────────────
  if (method === 'GET' && path === 'v1/knowledge/sources') {
    return json([])
  }

  if (method === 'GET' && path === 'v1/knowledge/documents') {
    return json({ items: [], total: 0 })
  }

  if (method === 'GET' && path === 'v1/knowledge/jobs') {
    return json({ items: [], total: 0 })
  }

  if (method === 'GET' && path === 'v1/dashboard/rag-metrics') {
    return json({
      generatedAt: now,
      corpus: { totalDocuments: 0, approvedDocuments: 0, pendingReview: 0, suspendedDocuments: 0 },
      jobs: { totalLast24h: 0, failedLast24h: 0 },
      retrieval: { totalLast24h: 0, groundedRate: 0, fallbackRate: 0, zeroHitRate: 0, avgLatencyMs: 0 },
      feedback: { total: 0, usefulRate: 0, groundedRate: 0 },
    })
  }

  if (method === 'GET' && path === 'v1/dashboard/rag-traces') {
    return json({ items: [], total: 0 })
  }

  if (method === 'POST' && path === 'v1/knowledge/sources') {
    return json({ _id: 'src-1', name: 'Test Source', authority: 'Test', sourceType: 'GUIDELINE', status: 'ACTIVE', country: 'CO', allowUrlIngest: false, authorityWeight: 1, isGlobalFallback: false })
  }

  return json({ message: `Unhandled E2E mock route ${method} ${path}` }, 404)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
