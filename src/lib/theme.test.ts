import { initTheme, setTheme } from './theme'

function mockSystemDark(dark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

const isDark = () => document.documentElement.classList.contains('dark')

describe('theme', () => {
  it('follows the system setting by default', () => {
    mockSystemDark(true)
    initTheme()
    expect(isDark()).toBe(true)
  })

  it('can force light or dark regardless of the system setting', () => {
    mockSystemDark(true)
    setTheme('light')
    expect(isDark()).toBe(false)

    mockSystemDark(false)
    setTheme('dark')
    expect(isDark()).toBe(true)

    setTheme('system')
    expect(isDark()).toBe(false)
  })
})
