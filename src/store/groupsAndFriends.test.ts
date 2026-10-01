import { isGroupSettledUp } from '@/domain/balances'
import { sharedGroups } from '@/domain/friendBalances'

import { useAppStore } from './appStore'

const state = () => useAppStore.getState()

beforeEach(() => {
  localStorage.clear()
  state().resetToSeed()
})

describe('deleting a Group (ticket 16)', () => {
  it('is only allowed when Settled Up, and removes the Group with all its records', () => {
    expect(isGroupSettledUp(state().data, 'g1')).toBe(false)
    expect(isGroupSettledUp(state().data, 'g3')).toBe(true)

    state().deleteGroup('g3')
    const { data } = state()
    expect(data.groups.map((g) => g.id)).toEqual(['g1', 'g2'])
    expect(data.expenses.some((e) => e.groupId === 'g3')).toBe(false)
    expect(data.settlements.some((s) => s.groupId === 'g3')).toBe(false)
    expect(data.expenses.some((e) => e.groupId === 'g1')).toBe(true)
    // Meera and Rahul stay Friends; they now share no Group with you.
    expect(sharedGroups(data, 'f8')).toEqual([])
    expect(data.friends.some((f) => f.id === 'f8')).toBe(true)
  })
})

describe('managing Friends (ticket 17)', () => {
  it('adds, edits and removes Friends, trimming details and dropping blank ones', () => {
    const id = state().addFriend({ name: ' Zoya Khan ', email: ' ', phone: '+91 90000 00000' })
    expect(state().data.friends.find((f) => f.id === id)).toEqual({ id, name: 'Zoya Khan', phone: '+91 90000 00000' })

    state().updateFriend(id, { name: 'Zoya K.', email: 'zoya@example.com', phone: '' })
    expect(state().data.friends.find((f) => f.id === id)).toEqual({ id, name: 'Zoya K.', email: 'zoya@example.com' })

    state().removeFriend(id)
    expect(state().data.friends.some((f) => f.id === id)).toBe(false)
  })
})
