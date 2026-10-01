import { expect, test, type Page } from '@playwright/test'

const sidebar = (page: Page) => page.getByRole('navigation', { name: 'Main' })

test('sidebar lists Groups and Friends alphabetically, and the filter narrows both', async ({ page }) => {
  await page.goto('/')
  const nav = sidebar(page)
  const groupLinks = nav.locator('a[href^="/groups/"]')
  await expect(groupLinks).toHaveText(['Flat 4B', 'Goa Trip', 'Office Lunch'])
  await expect(nav.locator('a[href^="/friends/"]')).toHaveCount(10)
  await expect(nav.locator('a[href^="/friends/"]').first()).toHaveText('Ananya Nair')

  await nav.getByRole('searchbox', { name: 'Filter groups and friends by name' }).fill('go')
  await expect(groupLinks).toHaveText(['Goa Trip'])
  await expect(nav.locator('a[href^="/friends/"]')).toHaveCount(0)

  await nav.getByRole('searchbox').fill('')
  await nav.getByRole('link', { name: 'Goa Trip' }).click()
  await expect(page).toHaveURL(/\/groups\/g1$/)
})

test('Settings: name and theme survive a reload, and reset restores the Seed Data', async ({ page }) => {
  await page.goto('/settings')
  const name = page.getByLabel('Your name')
  await expect(name).toHaveValue('Joseph')
  await name.fill('Joe')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Name updated')).toBeVisible()

  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.getByLabel('Your name')).toHaveValue('Joe')
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Reset to Seed Data' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByText('Data reset to the sample data')).toBeVisible()
  await expect(page.getByLabel('Your name')).toHaveValue('Joseph')
  // The theme is a preference, not data, so a reset leaves it alone.
  await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked()
})
