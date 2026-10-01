import { createSeedData } from './seed'
import { formerMembersIn, lockHint, openDebtsHint, removalBlockers } from './membership'
import { useAppStore } from '@/store/appStore'

beforeEach(() => {
  localStorage.clear()
  useAppStore.getState().resetToSeed()
})

describe('creating Groups and adding members', () => {
  it('puts the Current User first, then members in the order added, creating new Friends', () => {
    const id = useAppStore.getState().createGroup({
      name: '  Book club ',
      type: 'other',
      members: [
        { kind: 'friend', friendId: 'f3' },
        { kind: 'new', name: 'Zoya Khan', email: 'zoya@example.com', phone: ' ' },
        { kind: 'friend', friendId: 'f1' },
      ],
    })
    const { data } = useAppStore.getState()
    const group = data.groups.find((g) => g.id === id)!
    const zoya = data.friends.find((f) => f.name === 'Zoya Khan')!
    expect(group).toMatchObject({ name: 'Book club', type: 'other', formerMemberIds: [] })
    expect(group.memberIds).toEqual(['me', 'f3', zoya.id, 'f1'])
    expect(zoya).toEqual({ id: zoya.id, name: 'Zoya Khan', email: 'zoya@example.com' })
  })

  it('adds members at the end, and re-adding a Former Member makes them a member again', () => {
    const before = useAppStore.getState().data.expenses.filter((e) => e.groupId === 'g1')
    useAppStore.getState().addGroupMembers('g1', [{ kind: 'friend', friendId: 'f9' }, { kind: 'friend', friendId: 'f5' }])
    const { data } = useAppStore.getState()
    const goa = data.groups.find((g) => g.id === 'g1')!
    expect(goa.memberIds.slice(-2)).toEqual(['f9', 'f5'])
    expect(goa.formerMemberIds).toEqual([])
    // Existing Expenses keep their Shares.
    expect(data.expenses.filter((e) => e.groupId === 'g1')).toEqual(before)
  })
})

describe('removing members (ticket 15 rules)', () => {
  it('is blocked by any open Debt, even when the net Group Balance is ₹0', () => {
    const seed = createSeedData()
    // Hidden Debt: Rahul owes Meera and you owe Rahul the same, so Rahul's balance nets to 0.
    seed.expenses.push(
      { ...seed.expenses[0], id: 'x1', groupId: 'g3', payerId: 'f8', shares: [{ personId: 'f9', amount: 500 }], amount: 500 },
      { ...seed.expenses[0], id: 'x2', groupId: 'g3', payerId: 'f9', shares: [{ personId: 'me', amount: 500 }], amount: 500 },
    )
    const debts = removalBlockers(seed, 'g3', 'f9')
    expect(debts).toHaveLength(2)
    expect(openDebtsHint(seed, 'f9', debts)).toBe('Rahul still has open debts with Meera and you.')
    expect(removalBlockers(seed, 'g3', 'f8')).toHaveLength(1)
    expect(removalBlockers(createSeedData(), 'g3', 'f9')).toEqual([])
  })

  it('finds the Former Members a record involves, which lock it', () => {
    const seed = createSeedData()
    const goa = seed.groups.find((g) => g.id === 'g1')!
    const dinner = seed.expenses.find((e) => e.description === 'Beach shack dinner')!
    const villa = seed.expenses.find((e) => e.description.startsWith('Villa'))!
    const kabirPaidYou = seed.settlements.find((s) => s.fromId === 'f5')!
    expect(formerMembersIn(goa, dinner)).toEqual(['f5'])
    expect(formerMembersIn(goa, villa)).toEqual([])
    expect(formerMembersIn(goa, kabirPaidYou)).toEqual(['f5'])
    expect(lockHint(seed, ['f5'])).toBe('Kabir is no longer in this group. Re-add them to edit this.')
  })

  it('moves a removed member to Former Members, and never removes the Current User', () => {
    useAppStore.getState().removeGroupMember('g3', 'f9')
    useAppStore.getState().removeGroupMember('g3', 'me')
    const office = useAppStore.getState().data.groups.find((g) => g.id === 'g3')!
    expect(office.memberIds).toEqual(['me', 'f1', 'f8'])
    expect(office.formerMemberIds).toEqual(['f9'])
  })
})
