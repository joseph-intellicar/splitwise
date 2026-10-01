import { expect, test } from '@playwright/test'

test('All expenses: only what involves you, across groups, each row tagged with its Group', async ({ page }) => {
  await page.goto('/expenses')
  await expect(page.getByRole('heading', { level: 1, name: 'All expenses' })).toBeVisible()

  const internet = page.getByRole('button', { name: /Vikram’s internet bill/ })
  await expect(internet).toContainText('Flat 4B')
  await expect(internet).toContainText('you get back')
  await expect(page.getByRole('button', { name: /Biryani Friday/ })).toContainText('Office Lunch')
  await expect(page.getByRole('button', { name: /Dudhsagar falls/ })).toContainText('Goa Trip')

  // Not involved: you neither paid nor have a Share.
  await expect(page.getByRole('button', { name: /Parasailing at Baga/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Scooter rental/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Sneha paid Rohan/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Kabir paid you ₹900.00/ })).toContainText('Goa Trip')

  // Months, newest first, and no search or filters.
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('September 2026')
  await expect(page.getByRole('main').getByRole('searchbox')).toHaveCount(0)

  // Rows expand in place, as on a Group page.
  await internet.click()
  await expect(internet).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Paid it while Vikram was travelling.')).toBeVisible()
})

test('add an Expense from All expenses: choose a Group first', async ({ page }) => {
  await page.goto('/expenses')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  await expect(dialog.getByLabel('Description')).toHaveCount(0)
  await dialog.getByLabel('Group').click()
  await page.getByRole('option', { name: 'Goa Trip' }).click()
  await dialog.getByLabel('Description').fill('Souvenirs')
  await dialog.getByLabel('Amount').fill('500')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: /Souvenirs/ })).toContainText('Goa Trip')
})
