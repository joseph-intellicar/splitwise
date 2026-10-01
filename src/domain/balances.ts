import type { AppData, Expense, Paise, PersonId } from './types'
import { CURRENT_USER_ID } from './types'

/**
 * Everything here is derived from Expenses and Settlements on every call;
 * nothing is stored (ADR-0001). Rule numbers refer to the spec's
 * "Balance calculation" section.
 */

/** One open Debt: `debtorId` owes `creditorId` a positive `amount`. */
export interface Debt {
  debtorId: PersonId
  creditorId: PersonId
  amount: Paise
}

const pairKey = (a: PersonId, b: PersonId) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/**
 * Rules 1–3: the offset pairwise Debts in a Group, open ones only.
 * Each non-Payer Share is owed to the Payer; a Settlement from A to B
 * reduces what A owes B, any excess becoming B owing A.
 */
export function groupDebts(data: AppData, groupId: string): Debt[] {
  // For each pair, the signed amount the alphabetically-first person owes the other.
  const owedByFirst = new Map<string, Paise>()
  const add = (debtorId: PersonId, creditorId: PersonId, amount: Paise) => {
    const key = pairKey(debtorId, creditorId)
    const signed = debtorId < creditorId ? amount : -amount
    owedByFirst.set(key, (owedByFirst.get(key) ?? 0) + signed)
  }

  for (const expense of data.expenses) {
    if (expense.groupId !== groupId) continue
    for (const share of expense.shares) {
      if (share.personId !== expense.payerId) add(share.personId, expense.payerId, share.amount)
    }
  }
  for (const settlement of data.settlements) {
    if (settlement.groupId === groupId) add(settlement.fromId, settlement.toId, -settlement.amount)
  }

  const debts: Debt[] = []
  for (const [key, amount] of owedByFirst) {
    if (amount === 0) continue
    const [first, second] = key.split('|')
    debts.push(
      amount > 0
        ? { debtorId: first, creditorId: second, amount }
        : { debtorId: second, creditorId: first, amount: -amount },
    )
  }
  return debts
}

/** The open Debts in a Group that involve `personId`. */
export function debtsOf(debts: Debt[], personId: PersonId): Debt[] {
  return debts.filter((d) => d.debtorId === personId || d.creditorId === personId)
}

/**
 * Rule 4: a member's Group Balance; positive = gets back, negative = owes.
 * Computed from the records directly; equals the signed sum of their Debts.
 */
export function groupBalance(data: AppData, groupId: string, personId: PersonId): Paise {
  let balance = 0
  for (const expense of data.expenses) {
    if (expense.groupId !== groupId) continue
    if (expense.payerId === personId) balance += expense.amount
    balance -= shareOf(expense, personId)
  }
  for (const settlement of data.settlements) {
    if (settlement.groupId !== groupId) continue
    if (settlement.fromId === personId) balance += settlement.amount
    if (settlement.toId === personId) balance -= settlement.amount
  }
  return balance
}

/** Rule 8: Settled Up means none of the relevant Debts is open; a net ₹0 is not enough. */
export function isMemberSettledUp(data: AppData, groupId: string, personId: PersonId): boolean {
  return debtsOf(groupDebts(data, groupId), personId).length === 0
}

export function isGroupSettledUp(data: AppData, groupId: string): boolean {
  return groupDebts(data, groupId).length === 0
}

export function shareOf(expense: Expense, personId: PersonId): Paise {
  return expense.shares.find((s) => s.personId === personId)?.amount ?? 0
}

/** Involved: the Payer, or anyone with a Share. */
export function isInvolved(expense: Expense, personId: PersonId): boolean {
  return expense.payerId === personId || shareOf(expense, personId) > 0
}

export type Effect =
  | { kind: 'get-back'; amount: Paise }
  | { kind: 'owe'; amount: Paise }
  | { kind: 'not-involved' }

/** Rule 7, Group page and All expenses: what an Expense means for the Current User. */
export function expenseEffect(expense: Expense): Effect {
  if (!isInvolved(expense, CURRENT_USER_ID)) return { kind: 'not-involved' }
  const paid = expense.payerId === CURRENT_USER_ID ? expense.amount : 0
  const net = paid - shareOf(expense, CURRENT_USER_ID)
  return net >= 0 ? { kind: 'get-back', amount: net } : { kind: 'owe', amount: -net }
}
