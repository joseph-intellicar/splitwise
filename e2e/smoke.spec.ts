import { expect, test } from '@playwright/test'

test('opens the app and navigates between routes', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

  await page.getByRole('link', { name: 'All expenses' }).click()
  await expect(page).toHaveURL('/expenses')
  await expect(page.getByRole('heading', { level: 1, name: 'All expenses' })).toBeVisible()
})
