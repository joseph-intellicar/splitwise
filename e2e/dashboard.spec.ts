import { expect, test } from '@playwright/test'

test('Dashboard: figures, friend lists with breakdowns, and group cards that navigate', async ({ page }) => {
  await page.goto('/')
  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary).toContainText('You owe₹0.00')
  await expect(summary).toContainText('You get back₹32,834.57')
  await expect(summary).toContainText('Total balance+₹32,834.57')

  const getBack = page.getByRole('region', { name: 'You get back' })
  await expect(getBack.getByRole('link')).toHaveText([
    /Vikram Singh/,
    /Rohan Iyer/,
    /Ananya Nair/,
    /Priya Sharma/,
    /Sneha Reddy/,
    /Arjun Mehta/,
  ])
  await expect(page.getByRole('region', { name: 'You owe', exact: true })).toContainText("You don't owe anyone.")
  // Settled friends (Meera, Rahul, Kabir) and Nikhil appear in neither list.
  await expect(page.getByRole('main').getByRole('link', { name: /Meera Pillai/ })).toHaveCount(0)

  await getBack.getByRole('button', { name: 'Show Priya Sharma by group' }).click()
  await expect(getBack.getByText('Goa Trip: you get back ₹5,554.90')).toBeVisible()

  await getBack.getByRole('link', { name: /Priya Sharma/ }).click()
  await expect(page).toHaveURL(/\/friends\/f1$/)

  await page.goto('/')
  const groups = page.getByRole('region', { name: 'Your groups' })
  await expect(groups.getByRole('link')).toHaveText([
    /Flat 4B.*you get back ₹13,646.14/,
    /Goa Trip.*you get back ₹19,188.43/,
    /Office Lunch.*settled up/,
  ])
  await groups.getByRole('link', { name: /Office Lunch/ }).click()
  await expect(page).toHaveURL(/\/groups\/g3$/)
})

test('add an Expense from the Dashboard: choose a Group first', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add an expense' })
  await expect(dialog.getByLabel('Description')).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled()

  await dialog.getByLabel('Group').click()
  await page.getByRole('option', { name: 'Office Lunch' }).click()
  await expect(dialog.getByLabel('Group')).toHaveText('Office Lunch')
  await dialog.getByLabel('Description').fill('Cake for Meera')
  await dialog.getByLabel('Amount').fill('800')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Expense added to Office Lunch')).toBeVisible()

  // ₹800 among four: Priya, Meera and Rahul each owe you ₹200 more.
  await expect(page.getByRole('region', { name: 'Summary' })).toContainText('You get back₹33,434.57')
  await expect(page.getByRole('region', { name: 'Your groups' })).toContainText('Office Lunchyou get back ₹600.00')
})

test('an all settled up empty state when nobody owes anybody', async ({ page }) => {
  // Saved data is only written on the first change, so make one.
  await page.goto('/settings')
  await page.getByLabel('Your name').fill('Joe')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('splitwise-data')!)
    saved.state.data.expenses = []
    saved.state.data.settlements = []
    localStorage.setItem('splitwise-data', JSON.stringify(saved))
  })
  await page.goto('/')
  await expect(page.getByText("You're all settled up")).toBeVisible()
  await expect(page.getByRole('region', { name: 'You get back' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Add an expense' })).toHaveCount(2)
})
