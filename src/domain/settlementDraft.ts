import { debtsOf, groupDebts, type Debt } from './balances'
import { paiseToInputText, parseRupees } from './money'
import type { AppData, Group, IsoDate, PersonId, Settlement } from './types'
import { CURRENT_USER_ID } from './types'

/** What the Settle up form holds before it becomes a Settlement. */
export interface SettlementDraft {
  groupId: string
  fromId: PersonId | null
  toId: PersonId | null
  amountText: string
  date: IsoDate
}

/** The Current User's open Debts in a Group, largest first: the one-tap suggestions. */
export function settleUpSuggestions(data: AppData, groupId: string): Debt[] {
  return debtsOf(groupDebts(data, groupId), CURRENT_USER_ID).sort((a, b) => b.amount - a.amount)
}

/** A draft that pays `debt` back in full. */
export function draftForDebt(groupId: string, debt: Debt, date: IsoDate): SettlementDraft {
  return { groupId, fromId: debt.debtorId, toId: debt.creditorId, amountText: paiseToInputText(debt.amount), date }
}

/**
 * Pre-fill: your largest Debt you owe in the Group; otherwise the largest
 * someone owes you; both sides empty when you're Settled Up there.
 */
export function newSettlementDraft(data: AppData, groupId: string, date: IsoDate): SettlementDraft {
  const suggestions = settleUpSuggestions(data, groupId)
  const pick =
    suggestions.find((d) => d.debtorId === CURRENT_USER_ID) ?? suggestions.find((d) => d.creditorId === CURRENT_USER_ID)
  return pick ? draftForDebt(groupId, pick, date) : { groupId, fromId: null, toId: null, amountText: '', date }
}

export function draftFromSettlement(settlement: Settlement): SettlementDraft {
  return {
    groupId: settlement.groupId,
    fromId: settlement.fromId,
    toId: settlement.toId,
    amountText: paiseToInputText(settlement.amount),
    date: settlement.date,
  }
}

/** Two different current members, any positive amount, and a date no later than today. */
export function canSaveSettlement(draft: SettlementDraft, group: Group, today: IsoDate): boolean {
  const amount = parseRupees(draft.amountText)
  return (
    draft.fromId !== null &&
    draft.toId !== null &&
    draft.fromId !== draft.toId &&
    group.memberIds.includes(draft.fromId) &&
    group.memberIds.includes(draft.toId) &&
    amount !== null &&
    amount > 0 &&
    draft.date !== '' &&
    draft.date <= today
  )
}

export function settlementFromDraft(draft: SettlementDraft): Omit<Settlement, 'id' | 'createdAt'> {
  return {
    groupId: draft.groupId,
    fromId: draft.fromId!,
    toId: draft.toId!,
    amount: parseRupees(draft.amountText)!,
    date: draft.date,
  }
}
