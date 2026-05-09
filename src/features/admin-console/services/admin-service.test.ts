const getMock = jest.fn()
const postMock = jest.fn()
const patchMock = jest.fn()
const apiClientFactory = jest.fn(() => ({
  get: getMock,
  post: postMock,
  patch: patchMock,
}))
const getAccessToken = jest.fn()

jest.mock('@/api/api-client', () => ({
  apiClient: apiClientFactory,
}))

jest.mock('@/utils/config/envConfig', () => ({
  __esModule: true,
  default: {
    apiBaseUrl: 'https://api.saluddeuna.test/v1',
  },
}))

jest.mock('@/services/auth-service', () => ({
  authService: {
    getAccessToken,
  },
}))

describe('adminService', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    jest.clearAllMocks()

    getMock.mockResolvedValue({ data: { ok: true } })
    postMock.mockResolvedValue({ data: { ok: true } })
    patchMock.mockResolvedValue({ data: { ok: true } })
    getAccessToken.mockResolvedValue('admin-token')
    globalThis.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue('csv-content'),
    }) as unknown as typeof fetch
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
  })

  it('calls user, doctor and verification endpoints', async () => {
    const { adminService } = await import('@/features/admin-console/services/admin-service')

    await expect(adminService.listUsers({ role: 'DOCTOR', page: 2 })).resolves.toEqual({ ok: true })
    await expect(adminService.listDoctors({ status: 'PENDING', search: 'ana' })).resolves.toEqual({ ok: true })
    await expect(
      adminService.verifyDoctor('doctor-1', { action: 'APPROVE', notes: 'ok' }),
    ).resolves.toEqual({ ok: true })
    await expect(
      adminService.updateUserActive('DOCTOR', 'user-1', false),
    ).resolves.toEqual({ ok: true })

    expect(apiClientFactory).toHaveBeenCalledWith('')
    expect(getMock).toHaveBeenNthCalledWith(1, 'admin/users', {
      params: { role: 'DOCTOR', page: 2 },
    })
    expect(getMock).toHaveBeenNthCalledWith(2, 'admin/doctors', {
      params: { status: 'PENDING', search: 'ana' },
    })
    expect(postMock).toHaveBeenCalledWith('admin/doctors/doctor-1/rethus-verify', {
      action: 'APPROVE',
      notes: 'ok',
    })
    expect(patchMock).toHaveBeenCalledWith('admin/users/DOCTOR/user-1/active', {
      isActive: false,
    })
  })

  it('exports consultations CSV with filtered params and bearer token', async () => {
    const { adminService } = await import('@/features/admin-console/services/admin-service')

    await expect(
      adminService.exportConsultationsCsv({
        from: '2026-01-01',
        to: '',
        specialty: 'GENERAL_MEDICINE',
        priority: undefined,
      }),
    ).resolves.toBe('csv-content')

    expect(getAccessToken).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.saluddeuna.test/v1/admin/reports/consultations.csv?from=2026-01-01&specialty=GENERAL_MEDICINE',
      {
        headers: {
          Authorization: 'Bearer admin-token',
        },
      },
    )
  })

  it('calls AI prompt endpoints', async () => {
    const prompt = { _id: 'prompt-1', key: 'triage.prompt' }
    getMock.mockResolvedValueOnce({ data: { items: [prompt], total: 1 } })
    getMock.mockResolvedValueOnce({ data: [prompt] })
    postMock.mockResolvedValueOnce({ data: prompt })
    patchMock.mockResolvedValueOnce({ data: { ...prompt, active: true } })

    const { adminService } = await import('@/features/admin-console/services/admin-service')

    await expect(adminService.listAiPrompts({ page: 1, limit: 20 })).resolves.toEqual({
      items: [prompt],
      total: 1,
    })
    await expect(adminService.getAiPromptVersions('triage/general medicine')).resolves.toEqual([prompt])
    await expect(
      adminService.createAiPromptVersion({
        key: 'triage.prompt',
        systemInstruction: 'Be concise',
        model: 'gemini-2.5-flash',
      }),
    ).resolves.toEqual(prompt)
    await expect(adminService.toggleAiPromptActive('prompt-1', true)).resolves.toEqual({
      ...prompt,
      active: true,
    })

    expect(getMock).toHaveBeenNthCalledWith(1, 'admin/ai/prompts', {
      params: { page: 1, limit: 20 },
    })
    expect(getMock).toHaveBeenNthCalledWith(
      2,
      'admin/ai/prompts/triage%2Fgeneral%20medicine',
    )
    expect(postMock).toHaveBeenCalledWith('admin/ai/prompts', {
      key: 'triage.prompt',
      systemInstruction: 'Be concise',
      model: 'gemini-2.5-flash',
    })
    expect(patchMock).toHaveBeenCalledWith('admin/ai/prompts/prompt-1/toggle', {
      active: true,
    })
  })

  it('calls billing admin endpoints', async () => {
    getMock.mockResolvedValueOnce({ data: [{ specialty: 'GENERAL_MEDICINE', amount: 25000 }] })
    patchMock.mockResolvedValueOnce({ data: { specialty: 'GENERAL_MEDICINE', amount: 30000 } })
    getMock.mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, limit: 10 } })
    getMock.mockResolvedValueOnce({
      data: {
        currentMonth: { totalRevenue: 0, paidConsultations: 0, currency: 'COP' },
        bySpecialty: [],
      },
    })

    const { adminService } = await import('@/features/admin-console/services/admin-service')

    await expect(adminService.getBillingPrices()).resolves.toEqual([{ specialty: 'GENERAL_MEDICINE', amount: 25000 }])
    await expect(
      adminService.updateBillingPrice('GENERAL_MEDICINE', 30000),
    ).resolves.toEqual({ specialty: 'GENERAL_MEDICINE', amount: 30000 })
    await expect(
      adminService.getAdminTransactions({ status: 'COMPLETED', page: 1, limit: 10 }),
    ).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    })
    await expect(adminService.getRevenueMetrics()).resolves.toEqual({
      currentMonth: { totalRevenue: 0, paidConsultations: 0, currency: 'COP' },
      bySpecialty: [],
    })

    expect(getMock).toHaveBeenNthCalledWith(1, 'billing/prices')
    expect(patchMock).toHaveBeenNthCalledWith(1, 'billing/admin/prices/GENERAL_MEDICINE', {
      amount: 30000,
    })
    expect(getMock).toHaveBeenNthCalledWith(2, 'billing/admin/transactions', {
      params: { status: 'COMPLETED', page: 1, limit: 10 },
    })
    expect(getMock).toHaveBeenNthCalledWith(3, 'billing/admin/revenue')
  })
})
