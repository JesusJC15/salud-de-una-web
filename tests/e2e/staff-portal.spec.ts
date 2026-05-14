import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.locator('#login-password').fill('Password1!')
  await page.getByRole('button', { name: 'Acceder al Panel' }).click()
}

test('admin legacy login reaches the admin dashboard', async ({ page }) => {
  await login(page, 'admin@saluddeuna.test')
  await expect(page).toHaveURL(/\/admin/)
  await expect(page.getByText('Control Operativo')).toBeVisible()
})

test('doctor legacy login reaches the doctor portal', async ({ page }) => {
  await login(page, 'doctor@saluddeuna.test')
  await expect(page).toHaveURL(/\/doctor/)
  await expect(page.getByText('Funcionalidades disponibles')).toBeVisible()
  await expect(page.getByText('Cola de Consultas')).toBeVisible()
})

test('doctor cannot use the admin area', async ({ page }) => {
  await login(page, 'doctor@saluddeuna.test')
  await page.goto('/admin')
  await expect(page).not.toHaveURL(/\/admin$/)
})

test('admin can complete full REThUS verification form', async ({ page }) => {
  await login(page, 'admin@saluddeuna.test')
  await page.goto('/admin/doctors')
  await page.getByRole('link', { name: 'Revisar' }).click()
  await expect(page.getByText('Validación REThUS completa')).toBeVisible()

  await page.getByLabel('Profesión u ocupación').fill('Medicina general')
  await page.getByLabel('Acto administrativo').fill('Acta 123')
  await page.getByLabel('Entidad reportante').fill('Ministerio de Salud')
  await page.getByRole('button', { name: 'Guardar verificación' }).click()

  await expect(page).toHaveURL(/\/admin\/doctors/)
})

test('doctor can take a queued consultation and see clinical detail', async ({ page }) => {
  await login(page, 'doctor@saluddeuna.test')
  await page.goto('/doctor/queue')
  await page.getByRole('button', { name: 'Tomar caso' }).click()
  await expect(page).toHaveURL(/\/doctor\/consultations\/507f1f77bcf86cd799439022/)
  await expect(page.getByText('Chat clínico')).toBeVisible()
  await expect(page.getByText('Resumen clínico IA')).toBeVisible()
})

for (const width of [
  390,
  768,
  1366,
]) {
  test(`admin dashboard responsive smoke at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await login(page, 'admin@saluddeuna.test')
    await expect(page.getByText('Control Operativo')).toBeVisible()
  })
}

test('admin billing page loads prices and shows pagination UI', async ({ page }) => {
  await login(page, 'admin@saluddeuna.test')
  await page.goto('/admin/billing')
  await expect(page.getByRole('heading', { name: 'Facturación' })).toBeVisible()
  await expect(page.getByText('Medicina General')).toBeVisible()
  await expect(page.getByText('Odontología')).toBeVisible()
  await expect(page.getByText('Urgencias')).toBeVisible()
})

test('admin reports page shows date and specialty filter fields', async ({ page }) => {
  await login(page, 'admin@saluddeuna.test')
  await page.goto('/admin/reports')
  await expect(page.getByRole('heading', { name: 'Reportes' })).toBeVisible()
  await expect(page.getByLabel('Desde')).toBeVisible()
  await expect(page.getByLabel('Hasta')).toBeVisible()
  await expect(page.getByLabel('Especialidad')).toBeVisible()
  await expect(page.getByLabel('Prioridad')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar CSV' })).toBeVisible()
})

test('admin reports page applies filters as chips and allows clearing', async ({ page }) => {
  await login(page, 'admin@saluddeuna.test')
  await page.goto('/admin/reports')
  await page.getByLabel('Especialidad').selectOption('ODONTOLOGY')
  // Target the chip span specifically, not the <option> element
  const chip = page.locator('span').filter({ hasText: 'Odontología' })
  await expect(chip).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await expect(chip).not.toBeVisible()
})

test('knowledge form shows Zod validation error when source name is empty', async ({ page }) => {
  await login(page, 'admin@saluddeuna.test')
  await page.goto('/admin/knowledge')
  await expect(page.getByRole('heading', { name: 'Knowledge & RAG Console' })).toBeVisible()
  // Click "Crear fuente" without filling required fields
  await page.getByRole('button', { name: 'Crear fuente' }).click()
  // Should show inline validation error list
  await expect(page.getByText('Corregí los siguientes campos:')).toBeVisible()
})
