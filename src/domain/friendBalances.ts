import { groupDebts, shareOf } from './balances'
import { groupByMonth, type TimelineMonth } from './timeline'
import type { AppData, Expense, Group, Paise, PersonId } from './types'
import { CURRENT_USER_ID } from './types'

/** Groups the Current User shares with a Friend, including ones where the Friend is a Former Member. */
export function sharedGroups(data: AppData, friendId: PersonId): Group[] {
  return data.groups.filter(
    (g) =>
      g.memberIds.includes(CURRENT_USER_ID) &&
      (g.memberIds.includes(friendId) || g.formerMemberIds.includes(friendId)),
  )
}

export interface GroupTerm {
  group: Group
  /** Signed from the Current User's side: positive = you get back, negative = you owe. */
  amount: Paise
}

/** The pairwise Debt between you and the Friend in each shared Group (rule 5). */
export function friendBreakdown(data: AppData, friendId: PersonId): GroupTerm[] {
  return sharedGroups(data, friendId).map((group) => {
    const debt = groupDebts(data, group.id).find(
      (d) =>
        (d.debtorId === friendId && d.creditorId === CURRENT_USER_ID) ||
        (d.debtorId === CURRENT_USER_ID && d.creditorId === friendId),
    )
    const amount = !debt ? 0 : debt.creditorId === CURRENT_USER_ID ? debt.amount : -debt.amount
    return { group, amount }
  })
}

/** Rule 5: the sum of your pairwise Debts with the Friend across shared Groups. */
export function friendBalance(data: AppData, friendId: PersonId): Paise {
  return friendBreakdown(data, friendId).reduce((sum, term) => sum + term.amount, 0)
}

/** Rule 8: no open Debt with the Friend in any shared Group. A net ₹0 alone is not enough. */
export function isSettledUpWithFriend(data: AppData, friendId: PersonId): boolean {
  return friendBreakdown(data, friendId).every((term) => term.amount === 0)
}

/** Whether an Expense creates a Debt between you and the Friend: one paid, the other has a Share. */
export function isBetween(expense: Expense, friendId: PersonId): boolean {
  return (
    (expense.payerId === CURRENT_USER_ID && shareOf(expense, friendId) > 0) ||
    (expense.payerId === friendId && shareOf(expense, CURRENT_USER_ID) > 0)
  )
}

/** Rule 7, Friend page: only the part between you and this Friend. Positive = you get back. */
export function pairwiseEffect(expense: Expense, friendId: PersonId): Paise {
  if (expense.payerId === CURRENT_USER_ID) return shareOf(expense, friendId)
  if (expense.payerId === friendId) return -shareOf(expense, CURRENT_USER_ID)
  return 0
}

/** Everything between you and the Friend, across shared Groups, grouped by month. */
export function friendTimeline(data: AppData, friendId: PersonId): TimelineMonth[] {
  const groupIds = new Set(sharedGroups(data, friendId).map((g) => g.id))
  const pair = new Set([CURRENT_USER_ID, friendId])
  return groupByMonth([
    ...data.expenses
      .filter((e) => groupIds.has(e.groupId) && isBetween(e, friendId))
      .map((record) => ({ kind: 'expense' as const, record })),
    ...data.settlements
      .filter((s) => groupIds.has(s.groupId) && pair.has(s.fromId) && pair.has(s.toId))
      .map((record) => ({ kind: 'settlement' as const, record })),
  ])
}

/**
 * Groups where the Friend is a current member: the only ones an Expense or
 * Settlement with them can be added to (Former Members can't take part).
 */
export function actionGroups(data: AppData, friendId: PersonId): Group[] {
  return sharedGroups(data, friendId).filter((g) => g.memberIds.includes(friendId))
}

/** The Group whose newest item is latest, by date and then by when it was added. */
export function mostRecentlyActive(data: AppData, groups: Group[]): Group | undefined {
  const latest = (groupId: string) =>
    [...data.expenses, ...data.settlements]
      .filter((r) => r.groupId === groupId)
      .map((r) => `${r.date}|${r.createdAt}`)
      .sort()
      .at(-1) ?? ''
  return [...groups].sort((a, b) => (latest(b.id) > latest(a.id) ? 1 : latest(b.id) < latest(a.id) ? -1 : 0))[0]
}

/** Settle up from a Friend page defaults to the largest amount you owe, then the largest you get back. */
export function settleUpDefault(terms: GroupTerm[]): GroupTerm | undefined {
  const owe = terms.filter((t) => t.amount < 0).sort((a, b) => a.amount - b.amount)[0]
  const getBack = terms.filter((t) => t.amount > 0).sort((a, b) => b.amount - a.amount)[0]
  return owe ?? getBack ?? terms[0]
}
