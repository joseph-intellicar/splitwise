import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createSeedData, DATA_VERSION } from '@/domain/seed'
import type { AppData, Expense, Settlement } from '@/domain/types'

export const STORAGE_KEY = 'splitwise-data'

interface AppState {
  data: AppData
  setCurrentUserName: (name: string) => void
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void
  updateExpense: (id: string, changes: Omit<Expense, 'id' | 'createdAt' | 'groupId'>) => void
  deleteExpense: (id: string) => void
  addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void
  updateSettlement: (id: string, changes: Omit<Settlement, 'id' | 'createdAt' | 'groupId'>) => void
  deleteSettlement: (id: string) => void
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
