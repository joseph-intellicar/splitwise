import {
  actionGroups,
  friendBalance,
  friendBreakdown,
  friendTimeline,
  isSettledUpWithFriend,
  mostRecentlyActive,
  pairwiseEffect,
  settleUpDefault,
  sharedGroups,
} from './friendBalances'
import { createSeedData } from './seed'
import type { AppData, Expense, Settlement } from './types'
import { CURRENT_USER_ID as YOU } from './types'

let n = 0
const expense = (groupId: string, payerId: string, shares: Record<string, number>): Expense => {
  n += 1
  return {
    id: `e${n}`,
    groupId,
    description: `E${n}`,
    amount: Object.values(shares).reduce((s, x) => s + x, 0),
    payerId,
    shares: Object.entries(shares).map(([personId, amount]) => ({ personId, amount })),
    splitMethod: 'exact',
    categoryId: 'general',
    date: '2026-09-01',
    createdAt: `2026-09-01T00:00:${String(n).padStart(2, '0')}Z`,
  }
}
const settlement = (groupId: string, fromId: string, toId: string, amount: number): Settlement => {
  n += 1
  return { id: `s${n}`, groupId, fromId, toId, amount, date: '2026-09-02', createdAt: 't' }
}

function data(expenses: Expense[], settlements: Settlement[] = []): AppData {
  return {
    currentUser: { id: YOU, name: 'Joseph' },
    friends: [
      { id: 'p', name: 'Priya' },
      { id: 'a', name: 'Arjun' },
    ],
    groups: [
      { id: 'g1', name: 'Trip', type: 'trip', memberIds: [YOU, 'p', 'a'], formerMemberIds: [] },
      { id: 'g2', name: 'Flat', type: 'home', memberIds: [YOU, 'p'], formerMemberIds: [] },
      { id: 'g3', name: 'Other', type: 'other', memberIds: [YOU, 'a'], formerMemberIds: [] },
    ],
    expenses,
    settlements,
  }
}

describe('Friend Balance (rule 5)', () => {
  it('sums your pairwise Debt with the Friend across every shared Group, and nothing else', () => {
    const d = data([
      expense('g1', YOU, { p: 500, a: 500 }), // Priya owes you 500
      expense('g2', 'p', { [YOU]: 200 }), // you owe Priya 200
      expense('g1', 'a', { p: 999 }), // Priya owes Arjun: not between you two
    ])
    expect(sharedGroups(d, 'p').map((g) => g.id)).toEqual(['g1', 'g2'])
    expect(friendBreakdown(d, 'p').map((t) => [t.group.id, t.amount])).toEqual([
      ['g1', 500],
      ['g2', -200],
    ])
    expect(friendBalance(d, 'p')).toBe(300)
  })

  it('includes Groups where the Friend is a Former Member', () => {
    const seed = createSeedData()
    expect(sharedGroups(seed, 'f5').map((g) => g.name)).toEqual(['Goa Trip'])
    expect(friendBalance(seed, 'f5')).toBe(0)
  })
})

describe('Settled Up with a Friend (rules 8 and 9)', () => {
  it('a net ₹0 from offsetting Groups is not Settled Up', () => {
    const d = data([expense('g1', YOU, { p: 100 }), expense('g2', 'p', { [YOU]: 100 })])
    expect(friendBalance(d, 'p')).toBe(0)
    expect(isSettledUpWithFriend(d, 'p')).toBe(false)
  })

  it('is Settled Up once every Debt with the Friend is ₹0', () => {
    const d = data([expense('g1', YOU, { p: 100 })], [settlement('g1', 'p', YOU, 100)])
    expect(isSettledUpWithFriend(d, 'p')).toBe(true)
  })
})

describe('friend timeline', () => {
  it('only holds Expenses where one of you paid and the other has a Share, and Settlements between you', () => {
    const youPaidPriya = expense('g1', YOU, { p: 100 })
    const arjunPaidBoth = expense('g1', 'a', { [YOU]: 100, p: 100 }) // both share, but Arjun paid
    const notInvolved = expense('g1', 'p', { a: 100 })
    const priyaPaidYou = expense('g2', 'p', { [YOU]: 50, p: 50 })
    const priyaToYou = settlement('g1', 'p', YOU, 30)
    const priyaToArjun = settlement('g1', 'p', 'a', 30)
    const d = data([youPaidPriya, arjunPaidBoth, notInvolved, priyaPaidYou], [priyaToYou, priyaToArjun])
    const ids = friendTimeline(d, 'p').flatMap((m) => m.items.map((i) => i.record.id))
    expect(ids.sort()).toEqual([youPaidPriya.id, priyaPaidYou.id, priyaToYou.id].sort())
  })

  it('rows add up exactly to the Friend Balance, across the whole Seed Data', () => {
    const seed = createSeedData()
    for (const friend of seed.friends) {
      let sum = 0
      for (const month of friendTimeline(seed, friend.id)) {
        for (const item of month.items) {
          if (item.kind === 'expense') sum += pairwiseEffect(item.record, friend.id)
          else sum += item.record.fromId === YOU ? item.record.amount : -item.record.amount
        }
      }
      expect(sum).toBe(friendBalance(seed, friend.id))
    }
  })
})

describe('pairwiseEffect (rule 7, Friend page)', () => {
  it('shows only the part between you and the Friend', () => {
    const youPaid = expense('g1', YOU, { [YOU]: 300, p: 300, a: 300 })
    expect(pairwiseEffect(youPaid, 'p')).toBe(300)
    const priyaPaid = expense('g1', 'p', { [YOU]: 250, p: 250, a: 250 })
    expect(pairwiseEffect(priyaPaid, 'p')).toBe(-250)
  })
})

describe('friend page actions', () => {
  it('only offers Groups where the Friend is a current member', () => {
    const seed = createSeedData()
    expect(actionGroups(seed, 'f5')).toEqual([]) // Kabir is only a Former Member of Goa Trip
    expect(actionGroups(seed, 'f1').map((g) => g.name)).toEqual(['Goa Trip', 'Office Lunch'])
  })

  it('picks the shared Group with the latest activity', () => {
    const seed = createSeedData()
    expect(mostRecentlyActive(seed, actionGroups(seed, 'f1'))?.name).toBe('Office Lunch') // August beats May
  })

  it('defaults Settle up to the largest you owe, then the largest you get back', () => {
    const g = (id: string) => ({ id, name: id, type: 'other' as const, memberIds: [], formerMemberIds: [] })
    const terms = [
      { group: g('a'), amount: 900 },
      { group: g('b'), amount: -100 },
      { group: g('c'), amount: -300 },
    ]
    expect(settleUpDefault(terms)?.group.id).toBe('c')
    expect(settleUpDefault(terms.filter((t) => t.amount > 0))?.group.id).toBe('a')
    expect(settleUpDefault([{ group: g('z'), amount: 0 }])?.group.id).toBe('z')
  })
})
