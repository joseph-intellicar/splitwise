import { splitEqually } from './split'
import type { Expense, Group, IsoDate, Paise, PersonId, Share, SplitMethod } from './types'
import { formatPaise, paiseToInputText, parseRupees } from './money'

/** What the add-expense form holds before it becomes an Expense. */
export interface ExpenseDraft {
  groupId: string
  description: string
  amountText: string
  categoryId: string
  date: IsoDate
  notes: string
  payerId: PersonId | null
  /** Ticked people: eligible as Payer or sharer. */
  involvedIds: PersonId[]
  splitMethod: SplitMethod
  /** Equal: ticked people the amount is split among. */
  splitIds: PersonId[]
  /** Exact: each person's Share as typed; blank counts as ₹0.00. */
  exactTexts: Record<PersonId, string>
}

/** Today's date in the viewer's own time zone. */
export function todayIso(now = new Date()): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const involvedInOrder = (draft: ExpenseDraft, group: Group) =>
  group.memberIds.filter((id) => draft.involvedIds.includes(id))

/** An Exact entry in paise: blank is 0, unreadable text is null. */
function exactAmount(draft: ExpenseDraft, personId: PersonId): Paise | null {
  const text = draft.exactTexts[personId]?.trim() ?? ''
  return text === '' ? 0 : parseRupees(text)
}

/**
 * The draft's Shares, in Group member order. A ₹0.00 amount is never a Share.
 * Equal: divided among the split people, leftover paise going first.
 * Exact: each typed amount, unreadable entries left out.
 */
export function draftShares(draft: ExpenseDraft, group: Group): Share[] {
  const involved = involvedInOrder(draft, group)
  if (draft.splitMethod === 'exact') {
    return involved
      .map((personId) => ({ personId, amount: exactAmount(draft, personId) ?? 0 }))
      .filter((share) => share.amount > 0)
  }
  const amount = parseRupees(draft.amountText) ?? 0
  return splitEqually(amount, involved.filter((id) => draft.splitIds.includes(id)))
}

/** Exact split: the Amount minus the entered Shares (negative when too much is entered). */
export function leftToAssign(draft: ExpenseDraft, group: Group): Paise {
  const amount = parseRupees(draft.amountText) ?? 0
  return amount - draftShares(draft, group).reduce((sum, s) => sum + s.amount, 0)
}

/** "₹X left to assign", or how much over the Amount the entered Shares are. */
export function leftToAssignText(left: Paise): string {
  return left >= 0 ? `${formatPaise(left)} left to assign` : `${formatPaise(left)} more than the total`
}

/** At least one person other than the Payer has a Share greater than ₹0.00. */
export function hasOtherSharer(draft: ExpenseDraft, group: Group): boolean {
  return draftShares(draft, group).some((s) => s.personId !== draft.payerId)
}

/** Whether the draft satisfies every Expense rule, so it can be saved. */
export function canSaveDraft(draft: ExpenseDraft, group: Group, today: IsoDate): boolean {
  const amount = parseRupees(draft.amountText)
  const exactIsValid =
    draft.splitMethod !== 'exact' ||
    (involvedInOrder(draft, group).every((id) => exactAmount(draft, id) !== null) && leftToAssign(draft, group) === 0)
  return (
    draft.description.trim() !== '' &&
    amount !== null &&
    amount > 0 &&
    draft.payerId !== null &&
    draft.involvedIds.includes(draft.payerId) &&
    group.memberIds.includes(draft.payerId) &&
    draft.date !== '' &&
    draft.date <= today &&
    exactIsValid &&
    hasOtherSharer(draft, group)
  )
}

/** Switching to Exact starts each person off at their current equal Share, so nothing is left to assign. */
export function switchToExact(draft: ExpenseDraft, group: Group): ExpenseDraft {
  const shares = draftShares({ ...draft, splitMethod: 'equal' }, group)
  const exactTexts: Record<PersonId, string> = {}
  for (const personId of involvedInOrder(draft, group)) {
    const share = shares.find((s) => s.personId === personId)
    exactTexts[personId] = share ? paiseToInputText(share.amount) : ''
  }
  return { ...draft, splitMethod: 'exact', exactTexts }
}

/** An existing Expense back as a draft: its Payer and sharers ticked, its amounts as typed text. */
export function draftFromExpense(expense: Expense): ExpenseDraft {
  const sharerIds = expense.shares.map((s) => s.personId)
  const exactTexts: Record<PersonId, string> = {}
  for (const share of expense.shares) exactTexts[share.personId] = paiseToInputText(share.amount)
  return {
    groupId: expense.groupId,
    description: expense.description,
    amountText: paiseToInputText(expense.amount),
    categoryId: expense.categoryId,
    date: expense.date,
    notes: expense.notes ?? '',
    payerId: expense.payerId,
    involvedIds: [...new Set([expense.payerId, ...sharerIds])],
    splitMethod: expense.splitMethod,
    splitIds: sharerIds,
    exactTexts,
  }
}

/** The Expense record a valid draft becomes (without id and createdAt). */
export function expenseFromDraft(draft: ExpenseDraft, group: Group): Omit<Expense, 'id' | 'createdAt'> {
  const notes = draft.notes.trim()
  return {
    groupId: group.id,
    description: draft.description.trim(),
    amount: parseRupees(draft.amountText)!,
    payerId: draft.payerId!,
    shares: draftShares(draft, group),
    splitMethod: draft.splitMethod,
    categoryId: draft.categoryId,
    date: draft.date,
    ...(notes ? { notes } : {}),
  }
}
