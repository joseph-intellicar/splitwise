export type Theme = 'system' | 'light' | 'dark'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

let current: Theme = 'system'

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return darkQuery().matches ? 'dark' : 'light'
}

function apply() {
  document.documentElement.classList.toggle('dark', resolve(current) === 'dark')
}

export function getTheme(): Theme {
  return current
}

/** Force light or dark, or go back to following the system setting. */
export function setTheme(theme: Theme) {
  current = theme
  apply()
}

/** Apply the theme once at startup and keep following system changes. */
export function initTheme() {
  apply()
  darkQuery().addEventListener('change', () => {
    if (current === 'system') apply()
  })
}
