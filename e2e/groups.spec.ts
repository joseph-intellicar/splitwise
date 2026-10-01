import { expect, test, type Page } from '@playwright/test'

const sidebar = (page: Page) => page.getByRole('navigation', { name: 'Main' })

test('create a Group with existing Friends and a new person, then land on its page', async ({ page }) => {
  await page.goto('/')
  await sidebar(page).getByRole('button', { name: 'Add group' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create a group' })
  const create = dialog.getByRole('button', { name: 'Create group' })
  await expect(create).toBeDisabled()

  await dialog.getByLabel('Name', { exact: true }).fill('Book club')
  await dialog.getByText('Other', { exact: true }).click()
  await dialog.getByLabel('Add a friend').click()
  await page.getByRole('option', { name: 'Rohan Iyer' }).click()
  await dialog.getByRole('button', { name: 'New person' }).click()
  await dialog.getByLabel('Name', { exact: true }).last().fill('Zoya Khan')
  await dialog.getByLabel('Email').fill('zoya@example.com')
  await dialog.getByRole('button', { name: 'Add person' }).click()
  await dialog.getByLabel('Add a friend').click()
  await page.getByRole('option', { name: 'Meera Pillai' }).click()
  await expect(dialog.getByRole('list', { name: 'People to add' }).getByRole('listitem')).toHaveText([
    /Rohan Iyer/,
    /Zoya Khan.*\(new\)/,
    /Meera Pillai/,
  ])
  await create.click()

  await expect(page).toHaveURL(/\/groups\/[\w-]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Book club' })).toBeVisible()
  await expect(page.getByText('4 people')).toBeVisible()
  await expect(page.getByText('Group “Book club” created')).toBeVisible()
  await expect(sidebar(page).locator('a[href^="/groups/"]')).toHaveText([/^Book club/, /^Flat 4B/, /^Goa Trip/, /^Office Lunch/])
  await expect(sidebar(page).getByRole('link', { name: /^Zoya Khan/ })).toBeVisible()

  // Members are you first, then in the order added.
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const expense = page.getByRole('dialog', { name: 'Add an expense' })
  await expect(expense.getByRole('group', { name: "Who's involved" })).toHaveText(/You.*Rohan Iyer.*Zoya Khan.*Meera Pillai/)
})

test('group settings: rename, change type, and add members at the end', async ({ page }) => {
  await page.goto('/groups/g2')
  await page.getByRole('button', { name: 'Group settings' }).click()
  const dialog = page.getByRole('dialog', { name: 'Group settings' })

  await dialog.getByLabel('Name', { exact: true }).fill('Flat 4B, Indiranagar')
  await dialog.getByText('Other', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Group updated')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Flat 4B, Indiranagar', includeHidden: true })).toBeAttached()

  await dialog.getByLabel('Add a friend').click()
  await page.getByRole('option', { name: 'Nikhil Joshi' }).click()
  await dialog.getByRole('button', { name: 'Add to group' }).click()
  await expect(page.getByText('Member added')).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Members (4)' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('4 people')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Flat 4B, Indiranagar' })).toBeVisible()
  await expect(sidebar(page).getByRole('link', { name: /^Flat 4B, Indiranagar/ })).toBeVisible()

  // Existing Expenses keep their Shares, so balances don't move.
  await expect(page.getByRole('region', { name: 'Balances' })).toContainText('₹13,646.14')
  await page.goto('/friends/f10')
  await expect(page.getByText('No shared groups yet')).toHaveCount(0)
  await expect(page.getByText('You and Nikhil are all settled up')).toBeVisible()
})

test('remove a member only when Settled Up; their records lock until they are re-added', async ({ page }) => {
  // The seeded Former Member's records are already locked.
  await page.goto('/groups/g1')
  await page.getByRole('button', { name: /Beach shack dinner/ }).click()
  await expect(page.getByText('Kabir is no longer in this group. Re-add them to edit this.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0)

  // In Office Lunch everyone is settled; give Rahul an open Debt.
  await page.goto('/groups/g3')
  await page.getByRole('button', { name: 'Add an expense' }).click()
  const expense = page.getByRole('dialog', { name: 'Add an expense' })
  await expense.getByLabel('Description').fill('Chai')
  await expense.getByLabel('Amount').fill('100')
  const involved = expense.getByRole('group', { name: "Who's involved" })
  await involved.getByRole('checkbox', { name: 'Priya Sharma' }).click()
  await involved.getByRole('checkbox', { name: 'Meera Pillai' }).click()
  await expense.getByRole('button', { name: 'Save' }).click()

  await page.getByRole('button', { name: 'Group settings' }).click()
  const settings = page.getByRole('dialog', { name: 'Group settings' })
  await expect(settings.getByRole('button', { name: 'Remove Rahul Verma' })).toBeDisabled()
  await expect(settings.getByText('Rahul still has open debts with you.')).toBeVisible()
  await expect(settings.getByRole('button', { name: 'Remove Joseph' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Settle up' }).click()
  await page.getByRole('dialog', { name: 'Settle up' }).getByRole('button', { name: 'Save' }).click()

  await page.getByRole('button', { name: 'Group settings' }).click()
  await settings.getByRole('button', { name: 'Remove Rahul Verma' }).click()
  await expect(page.getByText('Rahul removed from Office Lunch')).toBeVisible()
  await expect(settings.getByRole('heading', { name: 'Former members' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('3 people')).toBeVisible()

  // His past records are now locked, and he can't be chosen for new ones.
  await page.getByRole('button', { name: /Chaat run/ }).click()
  await expect(page.getByText('Rahul is no longer in this group. Re-add them to edit this.')).toBeVisible()
  await page.getByRole('button', { name: 'Add an expense' }).click()
  await expect(expense.getByRole('group', { name: "Who's involved" })).not.toContainText('Rahul')
  await page.keyboard.press('Escape')

  // Re-adding unlocks everything.
  await page.getByRole('button', { name: 'Group settings' }).click()
  await settings.getByRole('button', { name: 'Re-add Rahul Verma' }).click()
  await expect(page.getByText('Rahul is back in Office Lunch')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Rahul is no longer in this group.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
})
