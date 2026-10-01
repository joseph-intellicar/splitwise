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

/**
 * Reads a typed rupee amount ("1200", "4,275.5", "99.99") into whole paise
 * without floating-point arithmetic. Returns null for anything that isn't a
 * plain non-negative amount with at most two decimals.
 */
export function parseRupees(text: string): Paise | null {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(text.trim().replaceAll(',', ''))
  if (!match) return null
  const [, whole, fraction = ''] = match
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

/** Paise as plain rupee text for an input field, e.g. 3334 → "33.34". */
export function paiseToInputText(amount: Paise): string {
  return `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, '0')}`
}
