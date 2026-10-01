import { debtsOf, groupDebts, type Debt } from './balances'
import { shortName } from './people'
import type { AppData, Expense, Group, PersonId, Settlement } from './types'
import { CURRENT_USER_ID } from './types'

/** Someone joining a Group: an existing Friend, or a new person who becomes a Friend. */
export type NewMember =
  | { kind: 'friend'; friendId: PersonId }
  | { kind: 'new'; name: string; email?: string; phone?: string }

/** A member's open Debts in the Group; removing them is allowed only when there are none. */
export function removalBlockers(data: AppData, groupId: string, personId: PersonId): Debt[] {
  return debtsOf(groupDebts(data, groupId), personId)
}

function listOf(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** "Arjun still has open debts with Priya and you." */
export function openDebtsHint(data: AppData, personId: PersonId, debts: Debt[]): string {
  const others = debts.map((d) => (d.debtorId === personId ? d.creditorId : d.debtorId))
  const names = others
    .filter((id) => id !== CURRENT_USER_ID)
    .map((id) => shortName(data, id))
    .concat(others.includes(CURRENT_USER_ID) ? ['you'] : [])
  return `${shortName(data, personId)} still has open debts with ${listOf(names)}.`
}

/** The Former Members a record involves; any at all make it read-only. */
export function formerMembersIn(group: Group, record: Expense | Settlement): PersonId[] {
  const people =
    'payerId' in record ? [record.payerId, ...record.shares.map((s) => s.personId)] : [record.fromId, record.toId]
  return group.formerMemberIds.filter((id) => people.includes(id))
}

/** "Kabir is no longer in this group. Re-add them to edit this." */
export function lockHint(data: AppData, formerIds: PersonId[]): string {
  const names = listOf(formerIds.map((id) => shortName(data, id)))
  return formerIds.length === 1
    ? `${names} is no longer in this group. Re-add them to edit this.`
    : `${names} are no longer in this group. Re-add them to edit this.`
}
