import type { Effect } from '@/domain/balances'
import { formatPaise } from '@/domain/money'
import type { Paise } from '@/domain/types'
import { cn } from '@/lib/utils'

/** The Current User's effect from one Expense: always words plus colour, never colour alone. */
export function EffectLabel({ effect, className }: { effect: Effect; className?: string }) {
  if (effect.kind === 'not-involved') {
    return <span className={cn('text-sm text-not-involved', className)}>not involved</span>
  }
  const getBack = effect.kind === 'get-back'
  return (
    <span className={cn('flex flex-col items-end text-right', className)}>
      <span className={cn('text-xs', getBack ? 'text-get-back' : 'text-owe')}>
        {getBack ? 'you get back' : 'you owe'}
      </span>
      <span className={cn('font-semibold tabular-nums', getBack ? 'text-get-back' : 'text-owe')}>
        {formatPaise(effect.amount)}
      </span>
    </span>
  )
}

/**
 * A member's Group Balance in words. `you` switches to second person.
 * A net ₹0 with open Debts is not Settled Up, so it's shown as a net amount.
 */
export function BalanceText({ balance, settledUp, you = false }: { balance: Paise; settledUp: boolean; you?: boolean }) {
  if (settledUp) return <span className="text-not-involved">settled up</span>
  if (balance === 0) return <span className="text-not-involved">₹0.00 net, with open debts</span>
  const getBack = balance > 0
  return (
    <span className={getBack ? 'text-get-back' : 'text-owe'}>
      {you ? 'you ' : ''}
      {getBack ? (you ? 'get back' : 'gets back') : you ? 'owe' : 'owes'}{' '}
      <span className="font-semibold tabular-nums">{formatPaise(balance)}</span>
    </span>
  )
}
