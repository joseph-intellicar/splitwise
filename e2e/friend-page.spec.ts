import { expect, test } from '@playwright/test'

test('Friend page: balance by group, and only what is between you two, as pairwise amounts', async ({ page }) => {
  await page.goto('/friends/f1')
  await expect(page.getByRole('heading', { level: 1, name: 'Priya Sharma' })).toBeVisible()
  await expect(page.getByText('priya.sharma@example.com')).toBeVisible()

  const balance = page.getByRole('region', { name: 'Balance' })
  await expect(balance).toContainText('You get back from Priya')
  await expect(balance).toContainText('₹5,554.90')
  // Office Lunch is settled, so only the non-zero Goa Trip part is listed.
  await expect(balance.getByRole('list', { name: 'By group' }).getByRole('listitem')).toHaveText([/Goa Trip.*you get back ₹5,554.90/])

  // You paid the ₹3,600 dinner for four: only Priya's ₹900 shows here.
  await expect(page.getByRole('button', { name: /Beach shack dinner/ })).toContainText('₹900.00')
  // Not between you two: Kabir paid, or you weren't in it.
  await expect(page.getByRole('button', { name: /Scooter rental/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Drinks at Tito/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Priya paid you ₹595.00/ })).toBeVisible()
})

test('settled up, net-zero and no-shared-group states, and an unknown friend', async ({ page }) => {
  await page.goto('/friends/f5')
  await expect(page.getByText('You and Kabir are all settled up')).toBeVisible()
  await expect(page.getByRole('button', { name: /Beach shack dinner/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Show settled expenses' }).click()
  await expect(page.getByRole('button', { name: /Beach shack dinner/ })).toBeVisible()

  await page.goto('/friends/f10')
  await expect(page.getByText('No shared groups yet')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create group with Nikhil' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add an expense' })).toHaveCount(0)

  // Make Priya's Goa Trip debt and an Office Lunch debt cancel out.
  await page.goto('/groups/g3')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  await dialog.getByLabel('Description').fill('Concert tickets')
  await dialog.getByLabel('Amount').fill('5554.90')
  await dialog.getByLabel('Paid by').click()
  await page.getByRole('option', { name: 'Priya Sharma' }).click()
  await dialog.getByLabel('and split').click()
  await page.getByRole('option', { name: 'by exact amounts' }).click()
  for (const name of ['Priya Sharma', 'Meera Pillai', 'Rahul Verma']) {
    await dialog.getByRole('textbox', { name }).fill('')
  }
  await dialog.getByRole('textbox', { name: 'You', exact: true }).fill('5554.90')
  await dialog.getByRole('button', { name: 'Save' }).click()

  await page.goto('/friends/f1')
  const balance = page.getByRole('region', { name: 'Balance' })
  await expect(balance).toContainText('₹0.00 net')
  await expect(balance.getByRole('listitem')).toHaveText([/Goa Trip.*you get back ₹5,554.90/, /Office Lunch.*you owe ₹5,554.90/])
  await expect(page.getByText('all settled up')).toHaveCount(0)

  await page.goto('/friends/nope')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
