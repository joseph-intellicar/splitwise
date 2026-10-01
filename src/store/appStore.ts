import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createSeedData, DATA_VERSION } from '@/domain/seed'
import type { AppData, Expense } from '@/domain/types'

export const STORAGE_KEY = 'splitwise-data'

interface AppState {
  data: AppData
  setCurrentUserName: (name: string) => void
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void
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
