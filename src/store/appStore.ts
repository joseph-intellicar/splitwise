import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createSeedData, DATA_VERSION } from '@/domain/seed'
import type { AppData } from '@/domain/types'

export const STORAGE_KEY = 'splitwise-data'

interface AppState {
  data: AppData
  setCurrentUserName: (name: string) => void
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
