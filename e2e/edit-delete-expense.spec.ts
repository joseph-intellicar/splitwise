import { expect, test } from '@playwright/test'

test('edit an Expense: the Group is locked, changes apply, and a new date moves it to its month', async ({ page }) => {
  await page.goto('/groups/g3')
  const row = page.getByRole('button', { name: /Chaat run/ })
  await expect(row).toContainText('you owe')
  await expect(row).toContainText('₹140.00')
  await row.click()
  await page.getByRole('button', { name: 'Edit' }).click()

  const dialog = page.getByRole('dialog', { name: 'Edit expense' })
  await expect(dialog.getByLabel('Group')).toBeDisabled()
  await expect(dialog.getByLabel('Description')).toHaveValue('Chaat run')
  await expect(dialog.getByLabel('Amount')).toHaveValue('420.00')
  await expect(dialog.getByLabel('Paid by')).toHaveText('Rahul Verma')

  await dialog.getByLabel('Description').fill('Chaat and lassi')
  await dialog.getByLabel('Amount').fill('600')
  await dialog.getByLabel('Date').fill('2026-07-15')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Expense updated')).toBeVisible()

  const july = page.getByRole('region', { name: 'July 2026' })
  const edited = july.getByRole('button', { name: /Chaat and lassi/ })
  await expect(edited).toContainText('Rahul paid ₹600.00')
  await expect(edited).toContainText('₹200.00')
  await expect(page.getByRole('button', { name: /Chaat run/ })).toHaveCount(0)
  // Office Lunch was settled; the bigger Share leaves you owing Rahul again.
  await expect(page.getByRole('region', { name: 'Balances' })).toContainText('You owe')
})

test('delete an Expense after confirming; cancelling keeps it', async ({ page }) => {
  await page.goto('/groups/g2')
  const balances = page.getByRole('region', { name: 'Balances' })
  await expect(balances).toContainText('₹13,646.14')

  const row = page.getByRole('button', { name: /Vikram’s internet bill/ })
  await row.click()
  await page.getByRole('button', { name: 'Delete' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Delete “Vikram’s internet bill”?')
  await confirm.getByRole('button', { name: 'Cancel' }).click()
  await expect(row).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Expense deleted')).toBeVisible()
  await expect(page.getByRole('button', { name: /Vikram’s internet bill/ })).toHaveCount(0)
  await expect(balances).toContainText('₹12,467.14')

  await page.reload()
  await expect(page.getByRole('button', { name: /Vikram’s internet bill/ })).toHaveCount(0)
})
