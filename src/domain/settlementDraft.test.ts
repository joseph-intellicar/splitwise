import { groupDebts } from './balances'
import { createSeedData } from './seed'
import {
  canSaveSettlement,
  draftFromSettlement,
  newSettlementDraft,
  settlementFromDraft,
  settleUpSuggestions,
  type SettlementDraft,
} from './settlementDraft'
import type { AppData, Expense, Group } from './types'
import { CURRENT_USER_ID as YOU } from './types'

const today = '2026-10-01'
const group: Group = { id: 'g', name: 'G', type: 'other', memberIds: [YOU, 'a', 'b'], formerMemberIds: ['x'] }

/** Shares given in whole rupees. */
const expense = (payerId: string, shares: Record<string, number>): Expense => ({
  id: `e-${payerId}-${Object.keys(shares).join()}`,
  groupId: 'g',
  description: 'E',
  amount: Object.values(shares).reduce((s, n) => s + n * 100, 0),
  payerId,
  shares: Object.entries(shares).map(([personId, rupees]) => ({ personId, amount: rupees * 100 })),
  splitMethod: 'exact',
  categoryId: 'general',
  date: '2026-09-01',
  createdAt: '2026-09-01T00:00:00Z',
})

const data = (expenses: Expense[]): AppData => ({
  currentUser: { id: YOU, name: 'Joseph' },
  friends: [],
  groups: [group],
  expenses,
  settlements: [],
})

describe('Settle up pre-fill', () => {
  it('prefers your largest Debt you owe', () => {
    const d = data([expense('a', { [YOU]: 100 }), expense('b', { [YOU]: 300 }), expense(YOU, { a: 900 })])
    expect(newSettlementDraft(d, 'g', today)).toEqual({ groupId: 'g', fromId: YOU, toId: 'b', amountText: '300.00', date: today })
  })

  it('falls back to the largest amount someone owes you', () => {
    const d = data([expense(YOU, { a: 100, b: 250 })])
    expect(newSettlementDraft(d, 'g', today)).toMatchObject({ fromId: 'b', toId: YOU, amountText: '250.00' })
  })

  it('leaves both sides empty when you are Settled Up in the Group', () => {
    const d = data([expense('a', { b: 500 })])
    expect(newSettlementDraft(d, 'g', today)).toEqual({ groupId: 'g', fromId: null, toId: null, amountText: '', date: today })
  })

  it('suggests each of your open Debts, largest first, and none of other people’s', () => {
    const d = data([expense('a', { [YOU]: 100, b: 700 }), expense(YOU, { b: 400 })])
    expect(settleUpSuggestions(d, 'g')).toEqual([
      { debtorId: 'b', creditorId: YOU, amount: 40000 },
      { debtorId: YOU, creditorId: 'a', amount: 10000 },
    ])
  })
})

describe('canSaveSettlement', () => {
  const draft = (overrides: Partial<SettlementDraft> = {}): SettlementDraft => ({
    groupId: 'g',
    fromId: 'a',
    toId: 'b',
    amountText: '50',
    date: today,
    ...overrides,
  })

  it('accepts any two different current members, including two friends', () => {
    expect(canSaveSettlement(draft(), group, today)).toBe(true)
  })

  it.each([
    ['the same person on both sides', { toId: 'a' }],
    ['a missing side', { fromId: null }],
    ['a Former Member', { fromId: 'x' }],
    ['a zero amount', { amountText: '0' }],
    ['an unreadable amount', { amountText: '5.555' }],
    ['a future date', { date: '2026-10-02' }],
  ])('rejects %s', (_, overrides) => {
    expect(canSaveSettlement(draft(overrides), group, today)).toBe(false)
  })
})

describe('settlements and Debts', () => {
  it('a partial payment reduces the Debt and over-paying reverses it', () => {
    const base = data([expense('a', { [YOU]: 1000 })])
    const pay = (amountText: string) => ({
      ...base,
      settlements: [{ ...settlementFromDraft({ groupId: 'g', fromId: YOU, toId: 'a', amountText, date: today }), id: 's', createdAt: 't' }],
    })
    expect(groupDebts(pay('400'), 'g')).toEqual([{ debtorId: YOU, creditorId: 'a', amount: 60000 }])
    expect(groupDebts(pay('1500'), 'g')).toEqual([{ debtorId: 'a', creditorId: YOU, amount: 50000 }])
  })

  it('round-trips a seeded Settlement through a draft', () => {
    const seed = createSeedData()
    const s = seed.settlements[0]
    expect({ ...settlementFromDraft(draftFromSettlement(s)), id: s.id, createdAt: s.createdAt }).toEqual(s)
  })
})
