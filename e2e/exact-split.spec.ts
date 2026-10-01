import { expect, test } from '@playwright/test'

test('Exact split: left to assign, ₹0 means no Share, and the Payer can have no Share', async ({ page }) => {
  await page.goto('/groups/g2')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  const save = dialog.getByRole('button', { name: 'Save' })

  await dialog.getByLabel('Description').fill('Vikram’s gym fees')
  await dialog.getByLabel('Amount').fill('900')
  await dialog.getByLabel('and split').click()
  await page.getByRole('option', { name: 'by exact amounts' }).click()

  // Starts from the equal Shares, so nothing is left to assign.
  const you = dialog.getByRole('textbox', { name: 'You', exact: true })
  const ananya = dialog.getByRole('textbox', { name: 'Ananya Nair' })
  const vikram = dialog.getByRole('textbox', { name: 'Vikram Singh' })
  await expect(you).toHaveValue('300.00')
  await expect(dialog.getByText('₹0.00 left to assign')).toBeVisible()
  await expect(save).toBeEnabled()

  await vikram.fill('500')
  await expect(dialog.getByText('₹200.00 more than the total')).toBeVisible()
  await expect(save).toBeDisabled()

  // Only the Payer has a Share: blocked with the hint.
  await you.fill('900')
  await ananya.fill('0')
  await vikram.fill('')
  await expect(dialog.getByText('Split with at least one other person.')).toBeVisible()
  await expect(save).toBeDisabled()

  // You pay, and only Vikram has a Share.
  await you.fill('0')
  await vikram.fill('900')
  await expect(dialog.getByText('Split with at least one other person.')).toBeHidden()
  await expect(dialog.getByText('₹0.00 left to assign')).toBeVisible()
  await save.click()
  await expect(dialog).toBeHidden()

  const row = page.getByRole('button', { name: /Vikram’s gym fees/ })
  await expect(row).toContainText('you get back')
  await expect(row).toContainText('₹900.00')
  await row.click()
  const details = page.locator('[id^="expense-"]').filter({ hasText: 'Shares' })
  await expect(details).toContainText('Vikram Singh')
  await expect(details).not.toContainText('Ananya Nair')
})
