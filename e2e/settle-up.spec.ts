import { expect, test } from '@playwright/test'

test('settle a Group’s Debts from the pre-fill and the suggestion chips until you are Settled Up', async ({ page }) => {
  await page.goto('/groups/g2')
  const balances = page.getByRole('region', { name: 'Balances' })
  await expect(balances).toContainText('Vikram owes you ₹8,084.58')

  await page.getByRole('button', { name: 'Settle up' }).click()
  const dialog = page.getByRole('dialog', { name: 'Settle up' })
  // Pre-filled with the largest amount owed to you (you owe nobody here).
  await expect(dialog.getByLabel('Who paid')).toHaveText('Vikram Singh')
  await expect(dialog.getByLabel('Paid to')).toHaveText('You')
  await expect(dialog.getByLabel('Amount')).toHaveValue('8084.58')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Payment recorded in Flat 4B')).toBeVisible()
  await expect(page.getByRole('button', { name: /Vikram paid you ₹8,084.58/ })).toBeVisible()
  await expect(balances).not.toContainText('Vikram owes you')

  await page.getByRole('button', { name: 'Settle up' }).click()
  await dialog.getByRole('button', { name: 'Ananya owes you ₹5,561.56' }).click()
  await expect(dialog.getByLabel('Who paid')).toHaveText('Ananya Nair')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(balances).toContainText("You're settled up")
})

test('partial and over-payments, payments between two friends, and the settled-up state', async ({ page }) => {
  await page.goto('/groups/g1')
  const balances = page.getByRole('region', { name: 'Balances' })
  const dialog = page.getByRole('dialog', { name: 'Settle up' })

  // A partial payment reduces the Debt.
  await page.getByRole('button', { name: 'Settle up' }).click()
  await dialog.getByRole('button', { name: 'Arjun owes you ₹2,700.00' }).click()
  await dialog.getByLabel('Amount').fill('700')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(balances).toContainText('Arjun owes you ₹2,000.00')

  // Paying more than owed reverses it.
  await page.getByRole('button', { name: 'Settle up' }).click()
  await dialog.getByRole('button', { name: 'Arjun owes you ₹2,000.00' }).click()
  await dialog.getByLabel('Amount').fill('2500')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(balances).toContainText('You owe Arjun ₹500.00')

  // Now that you owe someone, that comes first in the pre-fill.
  await page.getByRole('button', { name: 'Settle up' }).click()
  await expect(dialog.getByLabel('Who paid')).toHaveText('You')
  await expect(dialog.getByLabel('Paid to')).toHaveText('Arjun Mehta')

  // "Record another payment": any two current members, never a Former Member.
  await dialog.getByRole('button', { name: 'Record another payment' }).click()
  await expect(dialog.getByLabel('Amount')).toHaveValue('')
  await dialog.getByLabel('Who paid').click()
  await expect(page.getByRole('option', { name: 'Kabir Malhotra' })).toHaveCount(0)
  await page.getByRole('option', { name: 'Sneha Reddy' }).click()
  await dialog.getByLabel('Paid to').click()
  await page.getByRole('option', { name: 'Priya Sharma' }).click()
  await dialog.getByLabel('Amount').fill('100')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('button', { name: /Sneha paid Priya ₹100.00/ })).toBeVisible()

  // A settled group: nothing to pre-fill.
  await page.goto('/groups/g3')
  await page.getByRole('button', { name: 'Settle up' }).click()
  await expect(dialog.getByText("You're settled up in this group.")).toBeVisible()
  await expect(dialog.getByLabel('Amount')).toHaveValue('')
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled()
})

test('edit and delete a Settlement from its row', async ({ page }) => {
  await page.goto('/groups/g1')
  const balances = page.getByRole('region', { name: 'Balances' })
  await expect(balances).toContainText('Arjun owes you ₹2,700.00')

  const row = page.getByRole('button', { name: /Arjun paid you ₹2,000.00/ })
  await row.click()
  await page.getByRole('button', { name: 'Edit' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit payment' })
  await expect(dialog.getByLabel('Amount')).toHaveValue('2000.00')
  await dialog.getByLabel('Amount').fill('2500')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Payment updated')).toBeVisible()
  await expect(balances).toContainText('Arjun owes you ₹2,200.00')

  // The row stays expanded after the edit.
  await expect(page.getByRole('button', { name: /Arjun paid you ₹2,500.00/ })).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Payment deleted')).toBeVisible()
  await expect(balances).toContainText('Arjun owes you ₹4,700.00')
})
