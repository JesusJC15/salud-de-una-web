import { expect, test } from '@playwright/test'

// Diagnostic tests against the real Railway backend (no mock).
// Run: CI=true NEXT_PUBLIC_API_BASE_URL=https://salud-de-una-backend-production.up.railway.app
//      NEXT_PUBLIC_ENABLE_E2E_BACKEND_MOCK=false
//      JWT_SECRET=salud-de-una-backend-jwt-secret-NataliaJesusMayerllySantiago
//      npx playwright test tests/e2e/debug-login.spec.ts

test.describe('legacy login — real backend (Railway)', () => {
  test('admin login succeeds and lands on admin panel', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()

    await page.getByLabel('Correo electrónico').fill('admin@salud-de-una.com')
    await page.locator('#login-password').fill('admin123456.')

    const navPromise = page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
    await page.getByRole('button', { name: 'Acceder al Panel' }).click()
    await navPromise

    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByText('Panel de Administración')).toBeVisible({ timeout: 10_000 })
  })

  test('odontologo login succeeds and lands on doctor portal', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Correo electrónico')).toBeVisible()

    await page.getByLabel('Correo electrónico').fill('odontologo@saluddeuna.com')
    await page.locator('#login-password').fill('Odontologo123456')

    const navPromise = page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
    await page.getByRole('button', { name: 'Acceder al Panel' }).click()
    await navPromise

    await expect(page).toHaveURL(/\/doctor/)
    await expect(page.getByText('Portal médico')).toBeVisible({ timeout: 10_000 })
  })
})
