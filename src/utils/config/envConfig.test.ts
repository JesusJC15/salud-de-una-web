describe('envConfig', () => {
  const originalEnv = process.env
  let mutableEnv: Record<string, string | undefined>

  async function importFreshEnvConfig() {
    jest.resetModules()
    return import('./envConfig')
  }

  beforeEach(() => {
    process.env = { ...originalEnv }
    mutableEnv = process.env as Record<string, string | undefined>
    delete mutableEnv.NEXT_PUBLIC_API_BASE_URL
    delete mutableEnv.NODE_ENV
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses localhost defaults when NEXT_PUBLIC_API_BASE_URL is not defined', async () => {
    const { default: envConfig } = await importFreshEnvConfig()

    expect(envConfig).toMatchObject({
      env: 'development',
      backendOrigin: 'http://localhost:3000',
      baseUrl: 'http://localhost:3000',
      apiBaseUrl: 'http://localhost:3000/v1',
      socketBaseUrl: 'http://localhost:3000',
      localStorageKeys: {
        refreshToken: 'salud-de-una.refresh-token',
        user: 'salud-de-una.user',
      },
    })
  })

  it('normalizes the configured API base url and keeps the active NODE_ENV', async () => {
    mutableEnv.NEXT_PUBLIC_API_BASE_URL = 'https://api.saluddeuna.com///'
    mutableEnv.NODE_ENV = 'production'

    const { default: envConfig } = await importFreshEnvConfig()

    expect(envConfig).toMatchObject({
      env: 'production',
      backendOrigin: 'https://api.saluddeuna.com',
      baseUrl: 'https://api.saluddeuna.com',
      apiBaseUrl: 'https://api.saluddeuna.com/v1',
      socketBaseUrl: 'https://api.saluddeuna.com',
    })
  })

  it('normalizes a mistakenly configured /v1 suffix to a single API prefix', async () => {
    mutableEnv.NEXT_PUBLIC_API_BASE_URL = 'https://api.saluddeuna.com/v1/'

    const { default: envConfig } = await importFreshEnvConfig()

    expect(envConfig).toMatchObject({
      backendOrigin: 'https://api.saluddeuna.com',
      apiBaseUrl: 'https://api.saluddeuna.com/v1',
      socketBaseUrl: 'https://api.saluddeuna.com',
    })
  })
})
