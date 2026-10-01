import type { Paise, PersonId, Share } from './types'

/**
 * Divide `amount` evenly among `sharerIds`, which must be in Group member
 * order. Leftover paise go one each to the first sharers, so the Shares
 * always sum to `amount` and the same input always gives the same Shares.
 * Sharers whose amount would be ₹0 get no Share.
 */
export function splitEqually(amount: Paise, sharerIds: PersonId[]): Share[] {
  if (sharerIds.length === 0) return []
  const base = Math.floor(amount / sharerIds.length)
  const leftover = amount - base * sharerIds.length
  return sharerIds
    .map((personId, i) => ({ personId, amount: base + (i < leftover ? 1 : 0) }))
    .filter((share) => share.amount > 0)
}
