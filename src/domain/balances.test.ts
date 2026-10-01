import {
  debtsOf,
  expenseEffect,
  groupBalance,
  groupDebts,
  isGroupSettledUp,
  isMemberSettledUp,
  type Debt,
} from './balances'
import { createSeedData } from './seed'
import type { AppData, Expense, Settlement } from './types'
import { CURRENT_USER_ID as YOU } from './types'

let n = 0
function expense(payerId: string, shares: Record<string, number>, groupId = 'g'): Expense {
  n += 1
  const amount = Object.values(shares).reduce((a, b) => a + b, 0)
  return {
    id: `e${n}`,
    groupId,
    description: `Expense ${n}`,
    amount,
    payerId,
    shares: Object.entries(shares).map(([personId, amount]) => ({ personId, amount })),
    splitMethod: 'exact',
    categoryId: 'general',
    date: '2026-06-01',
    createdAt: `2026-06-01T00:00:${String(n).padStart(2, '0')}Z`,
  }
}

function settlement(fromId: string, toId: string, amount: number, groupId = 'g'): Settlement {
  n += 1
  return { id: `s${n}`, groupId, fromId, toId, amount, date: '2026-06-02', createdAt: `2026-06-02T00:00:00Z` }
}

function data(expenses: Expense[], settlements: Settlement[] = []): AppData {
  return {
    currentUser: { id: YOU, name: 'Joseph' },
    friends: [],
    groups: [],
    expenses,
    settlements,
  }
}

const sorted = (debts: Debt[]) =>
  [...debts].sort((a, b) => `${a.debtorId}${a.creditorId}`.localeCompare(`${b.debtorId}${b.creditorId}`))

describe('groupDebts', () => {
  it('rule 1: each non-Payer Share is owed to the Payer only, never between sharers', () => {
    const d = data([expense('a', { a: 300, b: 300, c: 300 })])
    expect(sorted(groupDebts(d, 'g'))).toEqual([
      { debtorId: 'b', creditorId: 'a', amount: 300 },
      { debtorId: 'c', creditorId: 'a', amount: 300 },
    ])
  })

  it('rule 2: a Settlement reduces the Debt, and any excess reverses it', () => {
    const base = [expense('a', { a: 500, b: 500 })]
    expect(groupDebts(data(base, [settlement('b', 'a', 200)]), 'g')).toEqual([
      { debtorId: 'b', creditorId: 'a', amount: 300 },
    ])
    expect(groupDebts(data(base, [settlement('b', 'a', 500)]), 'g')).toEqual([])
    expect(groupDebts(data(base, [settlement('b', 'a', 800)]), 'g')).toEqual([
      { debtorId: 'a', creditorId: 'b', amount: 300 },
    ])
  })

  it('rule 3: Debts in both directions are offset into one, and never combined across Groups', () => {
    const d = data([
      expense('a', { b: 1000 }),
      expense('b', { a: 400 }),
      expense('a', { b: 999 }, 'other'),
    ])
    expect(groupDebts(d, 'g')).toEqual([{ debtorId: 'b', creditorId: 'a', amount: 600 }])
    expect(groupDebts(d, 'other')).toEqual([{ debtorId: 'b', creditorId: 'a', amount: 999 }])
  })

  it('never reroutes a Debt through a third person', () => {
    // a owes b, b owes c: no simplification into "a owes c".
    const d = data([expense('b', { a: 100 }), expense('c', { b: 100 })])
    expect(sorted(groupDebts(d, 'g'))).toEqual([
      { debtorId: 'a', creditorId: 'b', amount: 100 },
      { debtorId: 'b', creditorId: 'c', amount: 100 },
    ])
  })
})

describe('groupBalance', () => {
  it('rule 4: paid minus own Shares, plus Settlements paid minus received', () => {
    const d = data([expense('a', { a: 300, b: 300, c: 300 })], [settlement('b', 'a', 100)])
    expect(groupBalance(d, 'g', 'a')).toBe(500)
    expect(groupBalance(d, 'g', 'b')).toBe(-200)
    expect(groupBalance(d, 'g', 'c')).toBe(-300)
  })

  it('equals the signed sum of the member’s Debts, across the whole Seed Data', () => {
    const seed = createSeedData()
    for (const group of seed.groups) {
      const debts = groupDebts(seed, group.id)
      for (const personId of [...group.memberIds, ...group.formerMemberIds]) {
        const fromDebts = debtsOf(debts, personId).reduce(
          (sum, d) => sum + (d.creditorId === personId ? d.amount : -d.amount),
          0,
        )
        expect(groupBalance(seed, group.id, personId)).toBe(fromDebts)
      }
    }
  })
})

describe('Settled Up (rule 8)', () => {
  it('needs every Debt at ₹0: a net Group Balance of ₹0 is not enough', () => {
    // b owes a 100, c owes b 100: b's balance nets to 0 but b has open Debts.
    const d = data([expense('a', { b: 100 }), expense('b', { c: 100 })])
    expect(groupBalance(d, 'g', 'b')).toBe(0)
    expect(isMemberSettledUp(d, 'g', 'b')).toBe(false)
  })

  it('a circle A→B→C→A has every net balance at ₹0 but the Group is not Settled Up', () => {
    const d = data([expense('b', { a: 100 }), expense('c', { b: 100 }), expense('a', { c: 100 })])
    for (const p of ['a', 'b', 'c']) expect(groupBalance(d, 'g', p)).toBe(0)
    expect(isGroupSettledUp(d, 'g')).toBe(false)
  })

  it('is reached once every Debt is paid back', () => {
    const d = data([expense('a', { a: 100, b: 100 })], [settlement('b', 'a', 100)])
    expect(isMemberSettledUp(d, 'g', 'b')).toBe(true)
    expect(isGroupSettledUp(d, 'g')).toBe(true)
  })

  it('matches the Seed Data: Office Lunch settled, Goa Trip not, Kabir settled', () => {
    const seed = createSeedData()
    expect(isGroupSettledUp(seed, 'g3')).toBe(true)
    expect(isGroupSettledUp(seed, 'g1')).toBe(false)
    expect(isMemberSettledUp(seed, 'g1', 'f5')).toBe(true)
  })
})

describe('expenseEffect (rule 7, Group page)', () => {
  it('you paid: you get back what you paid minus your own Share', () => {
    expect(expenseEffect(expense(YOU, { [YOU]: 400, b: 400, c: 400 }))).toEqual({ kind: 'get-back', amount: 800 })
  })

  it('you paid with no Share: you get back the full amount', () => {
    expect(expenseEffect(expense(YOU, { b: 1179 }))).toEqual({ kind: 'get-back', amount: 1179 })
  })

  it('someone else paid: you owe your Share', () => {
    expect(expenseEffect(expense('b', { [YOU]: 400, b: 400 }))).toEqual({ kind: 'owe', amount: 400 })
  })

  it('you are not the Payer and have no Share: not involved', () => {
    expect(expenseEffect(expense('b', { b: 300, c: 300 }))).toEqual({ kind: 'not-involved' })
  })
})
