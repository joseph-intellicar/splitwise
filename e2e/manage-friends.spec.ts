import { expect, test, type Page } from '@playwright/test'

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' })

test('add a Friend from the sidebar, edit their details, and remove them', async ({ page }) => {
  await page.goto('/')
  await nav(page).getByRole('button', { name: 'Add friend' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add a friend' })
  await expect(dialog.getByRole('button', { name: 'Add friend' })).toBeDisabled()
  await dialog.getByLabel('Name').fill('Zoya Khan')
  await dialog.getByLabel('Phone').fill('+91 90000 11111')
  await dialog.getByRole('button', { name: 'Add friend' }).click()
  await expect(page.getByText('Zoya Khan added to your friends')).toBeVisible()

  const friends = nav(page).locator('a[href^="/friends/"]')
  await expect(friends).toHaveCount(11)
  await expect(friends.last()).toHaveText(/^Zoya Khan/)

  await nav(page).getByRole('link', { name: /^Zoya Khan/ }).click()
  await expect(page.getByText('+91 90000 11111')).toBeVisible()
  await page.getByRole('button', { name: 'Edit details' }).click()
  const edit = page.getByRole('dialog', { name: 'Edit friend' })
  await expect(edit.getByLabel('Name')).toHaveValue('Zoya Khan')
  await edit.getByLabel('Name').fill('Abha Khan')
  await edit.getByLabel('Email').fill('abha@example.com')
  await edit.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Friend updated')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Abha Khan' })).toBeVisible()
  // Re-sorted alphabetically straight away.
  await expect(friends.first()).toHaveText(/^Abha Khan/)

  await page.getByRole('button', { name: 'Remove friend' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Abha Khan removed from your friends')).toBeVisible()
  await expect(friends).toHaveCount(10)
})

test('Remove friend stays visible but disabled while you share a Group', async ({ page }) => {
  await page.goto('/friends/f1')
  await expect(page.getByRole('button', { name: 'Remove friend' })).toBeDisabled()
  await expect(page.getByText("You can't remove Priya while you share a group.")).toBeVisible()

  // A Group they've left still counts.
  await page.goto('/friends/f5')
  await expect(page.getByRole('button', { name: 'Remove friend' })).toBeDisabled()
  await expect(page.getByText("You can't remove Kabir: they're still on past expenses in Goa Trip.")).toBeVisible()
})

test('"Create group with" a Friend who shares no Group pre-adds them', async ({ page }) => {
  await page.goto('/friends/f10')
  await page.getByRole('button', { name: 'Create group with Nikhil' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create a group' })
  await expect(dialog.getByRole('list', { name: 'People to add' })).toHaveText(/Nikhil Joshi/)
  await dialog.getByLabel('Name', { exact: true }).fill('Badminton')
  await dialog.getByRole('button', { name: 'Create group' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Badminton' })).toBeVisible()
  await expect(page.getByText('2 people')).toBeVisible()
  await page.goto('/friends/f10')
  await expect(page.getByText('You and Nikhil are all settled up')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add an expense' })).toBeVisible()
})
