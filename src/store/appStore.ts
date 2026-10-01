import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createSeedData, DATA_VERSION } from '@/domain/seed'
import type { NewMember } from '@/domain/membership'
import type { AppData, Expense, Friend, GroupType, PersonId, Settlement } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'

export const STORAGE_KEY = 'splitwise-data'

/** Turns NewMembers into Friend ids, creating Friends for new people. */
function resolveMembers(members: NewMember[]): { ids: PersonId[]; created: Friend[] } {
  const created: Friend[] = []
  const ids = members.map((m) => {
    if (m.kind === 'friend') return m.friendId
    const friend: Friend = { id: crypto.randomUUID(), name: m.name.trim() }
    if (m.email?.trim()) friend.email = m.email.trim()
    if (m.phone?.trim()) friend.phone = m.phone.trim()
    created.push(friend)
    return friend.id
  })
  return { ids, created }
}

interface AppState {
  data: AppData
  setCurrentUserName: (name: string) => void
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void
  updateExpense: (id: string, changes: Omit<Expense, 'id' | 'createdAt' | 'groupId'>) => void
  deleteExpense: (id: string) => void
  addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void
  updateSettlement: (id: string, changes: Omit<Settlement, 'id' | 'createdAt' | 'groupId'>) => void
  deleteSettlement: (id: string) => void
  /** Creates a Group with the Current User first, then `members` in order; returns its id. */
  createGroup: (group: { name: string; type: GroupType; members: NewMember[] }) => string
  updateGroupDetails: (id: string, details: { name: string; type: GroupType }) => void
  /** Adds members at the end of member order; re-adding a Former Member makes them a member again. */
  addGroupMembers: (id: string, members: NewMember[]) => void
  /** Moves a member to Former Members. Callers check they're Settled Up first. */
  removeGroupMember: (id: string, personId: PersonId) => void
  resetToSeed: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      data: createSeedData(),
      setCurrentUserName: (name) =>
        set((state) => ({
          data: { ...state.data, currentUser: { ...state.data.currentUser, name } },
        })),
      addExpense: (expense) =>
        set((state) => ({
          data: {
            ...state.data,
            expenses: [
              ...state.data.expenses,
              { ...expense, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ],
          },
        })),
      // The Group is fixed for life, and createdAt keeps its place among same-date items.
      updateExpense: (id, changes) =>
        set((state) => ({
          data: {
            ...state.data,
            expenses: state.data.expenses.map((e) =>
              e.id === id ? { id: e.id, groupId: e.groupId, createdAt: e.createdAt, ...changes } : e,
            ),
          },
        })),
      deleteExpense: (id) =>
        set((state) => ({
          data: { ...state.data, expenses: state.data.expenses.filter((e) => e.id !== id) },
        })),
      addSettlement: (settlement) =>
        set((state) => ({
          data: {
            ...state.data,
            settlements: [
              ...state.data.settlements,
              { ...settlement, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ],
          },
        })),
      updateSettlement: (id, changes) =>
        set((state) => ({
          data: {
            ...state.data,
            settlements: state.data.settlements.map((s) =>
              s.id === id ? { id: s.id, groupId: s.groupId, createdAt: s.createdAt, ...changes } : s,
            ),
          },
        })),
      deleteSettlement: (id) =>
        set((state) => ({
          data: { ...state.data, settlements: state.data.settlements.filter((s) => s.id !== id) },
        })),
      createGroup: ({ name, type, members }) => {
        const id = crypto.randomUUID()
        set((state) => {
          const { ids, created } = resolveMembers(members)
          const memberIds = [CURRENT_USER_ID, ...ids.filter((m) => m !== CURRENT_USER_ID)]
          return {
            data: {
              ...state.data,
              friends: [...state.data.friends, ...created],
              groups: [...state.data.groups, { id, name: name.trim(), type, memberIds, formerMemberIds: [] }],
            },
          }
        })
        return id
      },
      updateGroupDetails: (id, { name, type }) =>
        set((state) => ({
          data: {
            ...state.data,
            groups: state.data.groups.map((g) => (g.id === id ? { ...g, name: name.trim(), type } : g)),
          },
        })),
      addGroupMembers: (id, members) =>
        set((state) => {
          const { ids, created } = resolveMembers(members)
          return {
            data: {
              ...state.data,
              friends: [...state.data.friends, ...created],
              groups: state.data.groups.map((g) =>
                g.id !== id
                  ? g
                  : {
                      ...g,
                      memberIds: [...g.memberIds, ...ids.filter((m) => !g.memberIds.includes(m))],
                      formerMemberIds: g.formerMemberIds.filter((m) => !ids.includes(m)),
                    },
              ),
            },
          }
        }),
      removeGroupMember: (id, personId) =>
        set((state) => ({
          data: {
            ...state.data,
            groups: state.data.groups.map((g) =>
              g.id !== id || personId === CURRENT_USER_ID
                ? g
                : {
                    ...g,
                    memberIds: g.memberIds.filter((m) => m !== personId),
                    formerMemberIds: [...g.formerMemberIds, personId],
                  },
            ),
          },
        })),
      resetToSeed: () => set({ data: createSeedData() }),
    }),
    {
      name: STORAGE_KEY,
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ data: state.data }),
      // Saved data from another version is incompatible: never load it,
      // start from the current Seed Data instead.
      migrate: () => ({ data: createSeedData() }),
    },
  ),
)
