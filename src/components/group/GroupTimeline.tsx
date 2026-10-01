import { Banknote, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { EffectLabel } from '@/components/Amounts'
import { CategoryIcon } from '@/components/icons'
import { categoryLabel } from '@/domain/categories'
import { expenseEffect } from '@/domain/balances'
import { formatPaise } from '@/domain/money'
import { personName, shortName } from '@/domain/people'
import type { TimelineMonth } from '@/domain/timeline'
import type { AppData, Expense, Settlement } from '@/domain/types'
import { cn } from '@/lib/utils'

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' })

function DateStamp({ date }: { date: string }) {
  const parts = dayMonth.formatToParts(new Date(`${date}T00:00:00Z`))
  const month = parts.find((p) => p.type === 'month')!.value
  const day = parts.find((p) => p.type === 'day')!.value
  return (
    <span className="flex w-9 shrink-0 flex-col items-center text-muted-foreground" aria-hidden="true">
      <span className="text-[0.65rem] font-medium uppercase">{month}</span>
      <span className="text-lg leading-none font-semibold">{day}</span>
    </span>
  )
}

function ExpenseRow({ data, expense }: { data: AppData; expense: Expense }) {
  const [open, setOpen] = useState(false)
  const detailsId = `expense-${expense.id}`
  const date = new Date(`${expense.date}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <li className="rounded-xl border bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:gap-4 sm:p-4"
      >
        <DateStamp date={expense.date} />
        <CategoryIcon categoryId={expense.categoryId} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{expense.description}</span>
          <span className="truncate text-sm text-muted-foreground">
            {shortName(data, expense.payerId)} paid {formatPaise(expense.amount)}
          </span>
        </span>
        <EffectLabel effect={expenseEffect(expense)} />
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div id={detailsId} className="border-t px-4 py-4 text-sm sm:pl-[6.5rem]">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Date</dt>
            <dd>{date}</dd>
            <dt className="text-muted-foreground">Category</dt>
            <dd>{categoryLabel(expense.categoryId)}</dd>
            <dt className="text-muted-foreground">Paid by</dt>
            <dd>
              {personName(data, expense.payerId)} · {formatPaise(expense.amount)}
            </dd>
            <dt className="text-muted-foreground">Shares</dt>
            <dd>
              <ul className="flex flex-col gap-1">
                {expense.shares.map((share) => (
                  <li key={share.personId} className="flex max-w-xs justify-between gap-4">
                    <span>{personName(data, share.personId)}</span>
                    <span className="tabular-nums">{formatPaise(share.amount)}</span>
                  </li>
                ))}
              </ul>
            </dd>
            {expense.notes && (
              <>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-line">{expense.notes}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </li>
  )
}

function SettlementRow({ data, settlement }: { data: AppData; settlement: Settlement }) {
  const to = shortName(data, settlement.toId)
  return (
    <li className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground sm:gap-4 sm:px-4">
      <DateStamp date={settlement.date} />
      <span className="flex size-10 shrink-0 items-center justify-center">
        <Banknote className="size-5 text-primary" aria-hidden="true" />
      </span>
      <span>
        {shortName(data, settlement.fromId)} paid {to === 'You' ? 'you' : to}{' '}
        <span className="font-medium text-foreground tabular-nums">{formatPaise(settlement.amount)}</span>
      </span>
    </li>
  )
}

/** The full history, never folded, grouped by month. */
export function GroupTimeline({ data, months }: { data: AppData; months: TimelineMonth[] }) {
  if (months.length === 0) {
    return <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No expenses yet.</p>
  }
  return (
    <div className="flex flex-col gap-8">
      {months.map((month) => (
        <section key={month.month} aria-labelledby={`month-${month.month}`}>
          <h3 id={`month-${month.month}`} className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {month.label}
          </h3>
          <ul className="flex flex-col gap-2">
            {month.items.map((item) =>
              item.kind === 'expense' ? (
                <ExpenseRow key={item.record.id} data={data} expense={item.record} />
              ) : (
                <SettlementRow key={item.record.id} data={data} settlement={item.record} />
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  )
}
