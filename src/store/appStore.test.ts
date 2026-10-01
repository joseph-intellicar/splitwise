import { createSeedData, DATA_VERSION } from '@/domain/seed'

import { STORAGE_KEY, useAppStore } from './appStore'

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!)

beforeEach(() => {
  localStorage.clear()
  useAppStore.getState().resetToSeed()
})

describe('app store', () => {
  it('starts from the Seed Data and saves changes to browser storage', () => {
    expect(useAppStore.getState().data).toEqual(createSeedData())
    useAppStore.getState().setCurrentUserName('Joe')
    expect(saved()).toMatchObject({ version: DATA_VERSION, state: { data: { currentUser: { name: 'Joe' } } } })
  })

  it('restores saved data of the current version on reload', async () => {
    const edited = { ...createSeedData(), currentUser: { id: 'me', name: 'Joe' } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DATA_VERSION, state: { data: edited } }))
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().data.currentUser.name).toBe('Joe')
  })

  it('ignores saved data from another version and starts from the Seed Data', async () => {
    const stale = { ...createSeedData(), currentUser: { id: 'me', name: 'Old' } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DATA_VERSION + 1, state: { data: stale } }))
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().data).toEqual(createSeedData())
  })

  it('resets to the exact Seed Data', () => {
    useAppStore.getState().setCurrentUserName('Joe')
    useAppStore.getState().resetToSeed()
    expect(useAppStore.getState().data).toEqual(createSeedData())
  })
})
