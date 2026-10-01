import { useSyncExternalStore } from 'react'
import { Toaster as Sonner } from 'sonner'

import { isDarkApplied, subscribeTheme } from '@/lib/theme'

export function Toaster() {
  const dark = useSyncExternalStore(subscribeTheme, isDarkApplied)
  return <Sonner theme={dark ? 'dark' : 'light'} position="bottom-right" duration={3000} />
}
