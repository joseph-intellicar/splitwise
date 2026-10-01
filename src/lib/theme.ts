export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'splitwise-theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

let current: Theme = 'system'
const listeners = new Set<() => void>()

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return darkQuery().matches ? 'dark' : 'light'
}

function apply() {
  document.documentElement.classList.toggle('dark', resolve(current) === 'dark')
  listeners.forEach((listener) => listener())
}

function readSaved(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function getTheme(): Theme {
  return current
}

/** Whether the page is currently shown dark, whatever the preference. */
export function isDarkApplied(): boolean {
  return document.documentElement.classList.contains('dark')
}

/** Force light or dark, or go back to following the system setting. Remembered across reloads. */
export function setTheme(theme: Theme) {
  current = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage unavailable: the choice lasts for this session only.
  }
  apply()
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Apply the saved theme once at startup and keep following system changes. */
export function initTheme() {
  current = readSaved()
  apply()
  darkQuery().addEventListener('change', () => {
    if (current === 'system') apply()
  })
}
