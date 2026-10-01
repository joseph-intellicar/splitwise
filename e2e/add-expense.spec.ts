import { expect, test } from '@playwright/test'

test('add an equal-split Expense in a Group and see the row and balance card update', async ({ page }) => {
  await page.goto('/groups/g2')
  const balances = page.getByRole('region', { name: 'Balances' })
  await expect(balances).toContainText('₹13,646.14')

  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  await expect(dialog.getByLabel('Group')).toHaveText('Flat 4B')
  for (const name of ['You', 'Ananya Nair', 'Vikram Singh']) {
    await expect(dialog.getByRole('checkbox', { name, exact: true }).first()).toBeChecked()
  }

  const save = dialog.getByRole('button', { name: 'Save' })
  await expect(save).toBeDisabled()

  await dialog.getByLabel('Description').fill('Water purifier service')
  await dialog.getByLabel('Amount').fill('100')
  await dialog.getByLabel('Category').click()
  await page.getByRole('option', { name: 'Groceries' }).click()

  // ₹100.00 among three: the extra paisa goes to the first in member order.
  const split = dialog.getByRole('group', { name: 'Split equally between' })
  await expect(split.getByRole('listitem')).toHaveText([/You.*₹33\.34/, /Ananya Nair.*₹33\.33/, /Vikram Singh.*₹33\.33/])

  // Unticking yourself from the split keeps you as the Payer.
  await split.getByRole('checkbox', { name: 'You' }).click()
  await expect(split.getByRole('listitem')).toHaveText([/You.*no share/, /Ananya Nair.*₹50\.00/, /Vikram Singh.*₹50\.00/])
  await expect(dialog.getByLabel('Paid by')).toHaveText('You')

  await save.click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Expense added to Flat 4B')).toBeVisible()

  const row = page.getByRole('button', { name: /Water purifier service/ })
  await expect(row).toContainText('You paid ₹100.00')
  await expect(row).toContainText('you get back')
  await expect(row).toContainText('₹100.00')
  await expect(balances).toContainText('₹13,746.14')

  await page.reload()
  await expect(page.getByRole('button', { name: /Water purifier service/ })).toBeVisible()
})
