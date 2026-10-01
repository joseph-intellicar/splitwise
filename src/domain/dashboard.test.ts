import { groupBalance } from './balances'
import { dashboardFigures, isEverythingSettled } from './dashboard'
import { createSeedData } from './seed'
import type { AppData, Expense } from './types'
import { CURRENT_USER_ID as YOU } from './types'

let n = 0
const expense = (groupId: string, payerId: string, shares: Record<string, number>): Expense => {
  n += 1
  return {
    id: `e${n}`,
    groupId,
    description: 'E',
    amount: Object.values(shares).reduce((s, x) => s + x, 0),
    payerId,
    shares: Object.entries(shares).map(([personId, amount]) => ({ personId, amount })),
    splitMethod: 'exact',
    categoryId: 'general',
    date: '2026-09-01',
    createdAt: 't',
  }
}

const data = (expenses: Expense[]): AppData => ({
  currentUser: { id: YOU, name: 'Joseph' },
  friends: [
    { id: 'p', name: 'Priya' },
    { id: 'a', name: 'Arjun' },
  ],
  groups: [
    { id: 'g1', name: 'Trip', type: 'trip', memberIds: [YOU, 'p', 'a'], formerMemberIds: [] },
    { id: 'g2', name: 'Flat', type: 'home', memberIds: [YOU, 'p'], formerMemberIds: [] },
  ],
  expenses,
  settlements: [],
})

describe('dashboardFigures (rule 6)', () => {
  it('nets each Friend across Groups, so the figures can differ from summing the Group cards', () => {
    const d = data([
      expense('g1', YOU, { p: 500 }), // Priya owes you 500 in Trip
      expense('g2', 'p', { [YOU]: 200 }), // you owe Priya 200 in Flat
      expense('g1', 'a', { [YOU]: 100 }), // you owe Arjun 100 in Trip
    ])
    const figures = dashboardFigures(d)
    expect(figures.getBack.map((x) => [x.friend.id, x.amount])).toEqual([['p', 300]])
    expect(figures.owe.map((x) => [x.friend.id, x.amount])).toEqual([['a', 100]])
    expect([figures.youOwe, figures.youGetBack, figures.total]).toEqual([100, 300, 200])

    // Group cards: Trip +400, Flat −200. Summing their negatives gives "you owe 200", not 100.
    expect(groupBalance(d, 'g1', YOU)).toBe(400)
    expect(groupBalance(d, 'g2', YOU)).toBe(-200)
  })

  it('leaves a Friend whose balance nets to ₹0 out of both lists (rule 9)', () => {
    const d = data([expense('g1', YOU, { p: 100 }), expense('g2', 'p', { [YOU]: 100 })])
    const figures = dashboardFigures(d)
    expect(figures.owe).toEqual([])
    expect(figures.getBack).toEqual([])
    expect(figures.total).toBe(0)
    expect(isEverythingSettled(d)).toBe(false)
  })

  it('matches the Seed Data', () => {
    const figures = dashboardFigures(createSeedData())
    expect(figures.youOwe).toBe(0)
    expect(figures.getBack.map((x) => x.friend.name)).toEqual([
      'Vikram Singh',
      'Rohan Iyer',
      'Ananya Nair',
      'Priya Sharma',
      'Sneha Reddy',
      'Arjun Mehta',
    ])
    expect(figures.total).toBe(figures.youGetBack)
  })
})
