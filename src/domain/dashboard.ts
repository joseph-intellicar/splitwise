import { groupDebts } from './balances'
import { friendBalance } from './friendBalances'
import type { AppData, Friend, Paise } from './types'

export interface FriendAmount {
  friend: Friend
  /** Unsigned; the list it's in says the direction. */
  amount: Paise
}

export interface DashboardFigures {
  youOwe: Paise
  youGetBack: Paise
  /** you get back − you owe */
  total: Paise
  /** Friends with a negative Friend Balance, largest first. */
  owe: FriendAmount[]
  /** Friends with a positive Friend Balance, largest first. */
  getBack: FriendAmount[]
}

/**
 * Rule 6: the figures add up Friend Balances, each already netted across
 * Groups, so they can differ from adding up the Group cards. A Friend whose
 * balance nets to ₹0 is in neither list (rule 9).
 */
export function dashboardFigures(data: AppData): DashboardFigures {
  const owe: FriendAmount[] = []
  const getBack: FriendAmount[] = []
  for (const friend of data.friends) {
    const balance = friendBalance(data, friend.id)
    if (balance < 0) owe.push({ friend, amount: -balance })
    if (balance > 0) getBack.push({ friend, amount: balance })
  }
  const byAmount = (a: FriendAmount, b: FriendAmount) => b.amount - a.amount
  const sum = (list: FriendAmount[]) => list.reduce((s, x) => s + x.amount, 0)
  const youOwe = sum(owe)
  const youGetBack = sum(getBack)
  return { youOwe, youGetBack, total: youGetBack - youOwe, owe: owe.sort(byAmount), getBack: getBack.sort(byAmount) }
}

/** Whether you have no open Debt in any Group at all. */
export function isEverythingSettled(data: AppData): boolean {
  return data.groups.every((g) =>
    groupDebts(data, g.id).every((d) => d.debtorId !== data.currentUser.id && d.creditorId !== data.currentUser.id),
  )
}
