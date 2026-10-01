import { expect, test, type Page } from '@playwright/test'

const entry = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: new RegExp(`^${name}`) })

test('sidebar shows compact balances, hidden when Settled Up, and updates immediately', async ({ page }) => {
  await page.goto('/')
  await expect(entry(page, 'Flat 4B')).toHaveText('Flat 4Byou get back +₹13,646.14')
  await expect(entry(page, 'Vikram Singh')).toHaveText('Vikram Singhyou get back +₹8,084.58')
  // Settled Up: no hint at all.
  await expect(entry(page, 'Office Lunch')).toHaveText('Office Lunch')
  await expect(entry(page, 'Kabir Malhotra')).toHaveText('Kabir Malhotra')
  await expect(entry(page, 'Nikhil Joshi')).toHaveText('Nikhil Joshi')

  // You owe Rahul after he pays for something in Office Lunch.
  await page.goto('/groups/g3')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  await dialog.getByLabel('Description').fill('Samosas')
  await dialog.getByLabel('Amount').fill('80')
  await dialog.getByLabel('Paid by').click()
  await page.getByRole('option', { name: 'Rahul Verma' }).click()
  const involved = dialog.getByRole('group', { name: "Who's involved" })
  await involved.getByRole('checkbox', { name: 'Priya Sharma' }).click()
  await involved.getByRole('checkbox', { name: 'Meera Pillai' }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(entry(page, 'Rahul Verma')).toHaveText('Rahul Vermayou owe −₹40.00')
  await expect(entry(page, 'Office Lunch')).toHaveText('Office Lunchyou owe −₹40.00')

  // Pay him back: the hint disappears again.
  await page.getByRole('button', { name: 'Settle up' }).click()
  await page.getByRole('dialog', { name: 'Settle up' }).getByRole('button', { name: 'Save' }).click()
  await expect(entry(page, 'Rahul Verma')).toHaveText('Rahul Verma')
})

test('a Friend whose balance nets to ₹0 with open Debts shows ₹0.00', async ({ page }) => {
  // Priya owes you ₹5,554.90 in Goa Trip; make you owe her the same in Office Lunch.
  await page.goto('/groups/g3')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  await dialog.getByLabel('Description').fill('Concert tickets')
  await dialog.getByLabel('Amount').fill('5554.90')
  await dialog.getByLabel('Paid by').click()
  await page.getByRole('option', { name: 'Priya Sharma' }).click()
  const involved = dialog.getByRole('group', { name: "Who's involved" })
  await involved.getByRole('checkbox', { name: 'Meera Pillai' }).click()
  await involved.getByRole('checkbox', { name: 'Rahul Verma' }).click()
  await dialog.getByRole('group', { name: 'Split equally between' }).getByRole('checkbox', { name: 'Priya Sharma' }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()

  await expect(entry(page, 'Priya Sharma')).toHaveText('Priya Sharma₹0.00')
})
