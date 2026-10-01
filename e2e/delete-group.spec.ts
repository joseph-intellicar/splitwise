import { expect, test } from '@playwright/test'

test('a Group with open Debts cannot be deleted, and there is no "leave group"', async ({ page }) => {
  await page.goto('/groups/g1')
  await page.getByRole('button', { name: 'Group settings' }).click()
  const settings = page.getByRole('dialog', { name: 'Group settings' })
  await expect(settings.getByRole('button', { name: 'Delete group' })).toBeDisabled()
  await expect(settings.getByText('Settle all balances in Goa Trip before deleting it.')).toBeVisible()
  await expect(settings.getByRole('button', { name: /leave/i })).toHaveCount(0)
})

test('delete a Settled Up Group after confirming, then land on the Dashboard', async ({ page }) => {
  await page.goto('/groups/g3')
  await page.getByRole('button', { name: 'Group settings' }).click()
  const settings = page.getByRole('dialog', { name: 'Group settings' })
  await expect(settings.getByText(/Settle all balances/)).toHaveCount(0)

  // Cancelling keeps it.
  await settings.getByRole('button', { name: 'Delete group' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page).toHaveURL(/\/groups\/g3$/)

  await settings.getByRole('button', { name: 'Delete group' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Delete “Office Lunch”?')
  await confirm.getByRole('button', { name: 'Delete' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Group “Office Lunch” deleted')).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.locator('a[href^="/groups/"]')).toHaveText([/^Flat 4B/, /^Goa Trip/])
  // Its members stay Friends.
  await expect(nav.getByRole('link', { name: /^Meera Pillai/ })).toBeVisible()
  await page.goto('/groups/g3')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.goto('/friends/f8')
  await expect(page.getByText('No shared groups yet')).toBeVisible()
})
