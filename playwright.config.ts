import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3001/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3001/api/e2e-backend',
      NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK: 'true',
      NEXT_PUBLIC_AUTH0_DOMAIN: 'test.auth0.local',
      NEXT_PUBLIC_AUTH0_CLIENT_ID: 'test-client',
      NEXT_PUBLIC_AUTH0_AUDIENCE: 'https://api.salud-de-una.test',
      NEXT_PUBLIC_AUTH0_REDIRECT_URI: 'http://127.0.0.1:3001/callback',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
