import type { Paise } from './types'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats an unsigned amount, e.g. 123450 → "₹1,234.50". Callers say the direction in words. */
export function formatPaise(amount: Paise): string {
  return inr.format(Math.abs(amount) / 100)
}
