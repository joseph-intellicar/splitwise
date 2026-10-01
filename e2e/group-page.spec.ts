import { expect, test } from '@playwright/test'

test('Group page shows balances and a month-grouped timeline with expandable rows', async ({ page }) => {
  await page.goto('/groups/g1')
  await expect(page.getByRole('heading', { level: 1, name: 'Goa Trip' })).toBeVisible()
  await expect(page.getByText('5 people')).toBeVisible()

  const balances = page.getByRole('region', { name: 'Balances' })
  await expect(balances.getByText('You get back')).toBeVisible()
  await balances.getByRole('button', { name: 'See all balances' }).click()
  const all = page.getByRole('dialog', { name: 'All balances in Goa Trip' })
  await all.getByRole('button', { name: /Priya Sharma/ }).click()
  await expect(all.getByText('Arjun owes Priya ₹345.10')).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('heading', { name: 'May 2026' })).toBeVisible()
  const parasailing = page.getByRole('button', { name: /Parasailing at Baga/ })
  await expect(parasailing).toContainText('not involved')

  const seafood = page.getByRole('button', { name: /Seafood at Britto/ })
  await expect(seafood).toContainText('you owe')
  await seafood.press('Enter')
  await expect(seafood).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Dining out')).toBeVisible()

  await expect(page.getByText('Kabir paid you ₹900.00')).toBeVisible()
})

test('a settled group says so, and an unknown group shows not found', async ({ page }) => {
  await page.goto('/groups/g3')
  await expect(page.getByText("You're settled up")).toBeVisible()

  await page.goto('/groups/nope')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
