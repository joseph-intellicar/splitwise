import { createSeedData } from './seed'
import type { AppData } from './types'
import { CURRENT_USER_ID } from './types'

const seed = createSeedData()
const groupNamed = (name: string) => seed.groups.find((g) => g.name === name)!

/** Test-only pairwise tally: amount `a` owes `b` in a group (negative = b owes a). */
function pairwiseDebts(data: AppData, groupId: string) {
  const debts = new Map<string, number>()
  const add = (debtor: string, creditor: string, amount: number) => {
    const [x, y] = [debtor, creditor].sort()
    const key = `${x}|${y}`
    debts.set(key, (debts.get(key) ?? 0) + (debtor === x ? amount : -amount))
  }
  for (const e of data.expenses.filter((e) => e.groupId === groupId)) {
    for (const s of e.shares) if (s.personId !== e.payerId) add(s.personId, e.payerId, s.amount)
  }
  for (const s of data.settlements.filter((s) => s.groupId === groupId)) add(s.fromId, s.toId, -s.amount)
  return debts
}

describe('Seed Data', () => {
  it('is identical on every call', () => {
    expect(createSeedData()).toEqual(createSeedData())
  })

  it('has the agreed people and groups', () => {
    expect(seed.currentUser).toEqual({ id: CURRENT_USER_ID, name: 'Joseph' })
    expect(seed.friends).toHaveLength(10)
    expect(seed.groups.map((g) => [g.name, g.type, g.memberIds.length])).toEqual([
      ['Goa Trip', 'trip', 5],
      ['Flat 4B', 'home', 3],
      ['Office Lunch', 'other', 4],
    ])
    for (const g of seed.groups) expect(g.memberIds[0]).toBe(CURRENT_USER_ID)

    const inSomeGroup = new Set(seed.groups.flatMap((g) => [...g.memberIds, ...g.formerMemberIds]))
    const friendsInGroups = seed.friends.filter((f) => inSomeGroup.has(f.id))
    expect(friendsInGroups).toHaveLength(9)

    const groupCount = (id: string) =>
      seed.groups.filter((g) => g.memberIds.includes(id) || g.formerMemberIds.includes(id)).length
    expect(friendsInGroups.some((f) => groupCount(f.id) > 1)).toBe(true)
  })

  it('satisfies every Expense rule', () => {
    const today = new Date().toISOString().slice(0, 10)
    for (const e of seed.expenses) {
      const group = seed.groups.find((g) => g.id === e.groupId)!
      const people = [...group.memberIds, ...group.formerMemberIds]
      expect(e.description.trim()).not.toBe('')
      expect(Number.isInteger(e.amount) && e.amount > 0).toBe(true)
      expect(e.shares.every((s) => Number.isInteger(s.amount) && s.amount > 0)).toBe(true)
      expect(e.shares.reduce((sum, s) => sum + s.amount, 0)).toBe(e.amount)
      expect(e.shares.some((s) => s.personId !== e.payerId)).toBe(true)
      expect(people).toContain(e.payerId)
      for (const s of e.shares) expect(people).toContain(s.personId)
      expect(e.date <= today).toBe(true)
      expect(e.date).toMatch(/^2026-(0[4-9])-\d\d$/)
    }
    for (const s of seed.settlements) {
      expect(s.amount > 0 && s.fromId !== s.toId).toBe(true)
      expect(s.date <= today).toBe(true)
    }
  })

  it('contains the agreed scenarios', () => {
    const goa = groupNamed('Goa Trip')
    const goaExpenses = seed.expenses.filter((e) => e.groupId === goa.id)
    const involvesMe = (e: (typeof goaExpenses)[number]) =>
      e.payerId === CURRENT_USER_ID || e.shares.some((s) => s.personId === CURRENT_USER_ID)

    expect(goaExpenses.some((e) => !involvesMe(e))).toBe(true)
    expect(goaExpenses.some((e) => e.splitMethod === 'exact')).toBe(true)

    expect(goa.formerMemberIds).toHaveLength(1)
    const [former] = goa.formerMemberIds
    expect(goaExpenses.some((e) => e.payerId === former || e.shares.some((s) => s.personId === former))).toBe(true)
    const goaDebts = pairwiseDebts(seed, goa.id)
    for (const [pair, amount] of goaDebts) if (pair.split('|').includes(former)) expect(amount).toBe(0)
    expect([...goaDebts.values()].some((amount) => amount !== 0)).toBe(true) // partly settled

    const flat = groupNamed('Flat 4B')
    expect(
      seed.expenses.some((e) => e.groupId === flat.id && !e.shares.some((s) => s.personId === e.payerId)),
    ).toBe(true)

    const office = groupNamed('Office Lunch')
    expect([...pairwiseDebts(seed, office.id).values()].every((amount) => amount === 0)).toBe(true)
  })
})
