describe('encodeId and decodeId', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ID_ENCRYPTION_KEY = 'test-encryption-key'
    jest.resetModules()
  })

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_ID_ENCRYPTION_KEY
  })

  it('encodes and decodes string values', async () => {
    const { decodeId, encodeId } = await import('@/utils/encode')

    const cipher = encodeId('abc-123')

    expect(cipher).not.toBe('abc-123')
    expect(decodeId(cipher)).toBe('abc-123')
  })

  it('encodes numeric values as strings', async () => {
    const { decodeId, encodeId } = await import('@/utils/encode')

    expect(decodeId(encodeId(987654))).toBe('987654')
  })
})
