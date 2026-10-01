import { expect, test } from '@playwright/test'

test('add an Expense from a Friend page: only shared Groups, the latest one selected, that Friend ticked', async ({ page }) => {
  await page.goto('/friends/f1')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })

  // Office Lunch (August) is more recently active than Goa Trip (May).
  await expect(dialog.getByLabel('Group')).toHaveText('Office Lunch')
  await dialog.getByLabel('Group').click()
  await expect(page.getByRole('option')).toHaveText(['Goa Trip', 'Office Lunch'])
  await page.getByRole('option', { name: 'Office Lunch' }).click()

  const involved = dialog.getByRole('group', { name: "Who's involved" })
  await expect(involved.getByRole('checkbox', { name: 'You' })).toBeChecked()
  await expect(involved.getByRole('checkbox', { name: 'Priya Sharma' })).toBeChecked()
  await expect(involved.getByRole('checkbox', { name: 'Meera Pillai' })).not.toBeChecked()

  await dialog.getByLabel('Description').fill('Movie night')
  await dialog.getByLabel('Amount').fill('600')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Expense added to Office Lunch')).toBeVisible()

  const balance = page.getByRole('region', { name: 'Balance' })
  await expect(balance).toContainText('₹5,854.90')
  await expect(balance.getByRole('listitem')).toHaveText([/Goa Trip.*₹5,554.90/, /Office Lunch.*you get back ₹300.00/])
  await expect(page.getByRole('button', { name: /Movie night/ })).toContainText('₹300.00')
})

test('settle up from a Friend page: shared Groups with their amounts, largest first', async ({ page }) => {
  await page.goto('/friends/f1')
  await page.getByRole('button', { name: 'Settle up' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settle up' })

  // You owe Priya nothing, so the largest amount you get back comes first.
  await expect(dialog.getByLabel('Group')).toHaveText('Goa Trip · you get back ₹5,554.90')
  await expect(dialog.getByLabel('Who paid')).toHaveText('Priya Sharma')
  await expect(dialog.getByLabel('Paid to')).toHaveText('You')
  await expect(dialog.getByLabel('Amount')).toHaveValue('5554.90')

  await dialog.getByLabel('Group').click()
  await expect(page.getByRole('option')).toHaveText(['Goa Trip · you get back ₹5,554.90', 'Office Lunch · settled up'])
  await page.getByRole('option', { name: /Goa Trip/ }).click()

  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Payment recorded in Goa Trip')).toBeVisible()
  await expect(page.getByText('You and Priya are all settled up')).toBeVisible()
})

test('a Friend who is only a Former Member, or shares no Group, has no way to add an Expense', async ({ page }) => {
  await page.goto('/friends/f5')
  await expect(page.getByText('You and Kabir are all settled up')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add an expense' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Settle up' })).toHaveCount(0)

  await page.goto('/friends/f10')
  await expect(page.getByRole('button', { name: 'Add an expense' })).toHaveCount(0)
})
