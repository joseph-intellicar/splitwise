import { Banknote, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EffectLabel } from '@/components/Amounts'
import { CategoryIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { categoryLabel } from '@/domain/categories'
import type { Effect } from '@/domain/balances'
import { formatPaise } from '@/domain/money'
import { personName, shortName } from '@/domain/people'
import type { TimelineMonth } from '@/domain/timeline'
import type { AppData, Expense, Settlement } from '@/domain/types'
import { useAppStore } from '@/store/appStore'
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

/** A Delete button that asks first; deleting is permanent. */
function ConfirmDeleteButton({ title, description, onConfirm }: { title: string; description: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const longDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function ExpenseRow({
  data,
  expense,
  effect,
  onEdit,
}: {
  data: AppData
  expense: Expense
  effect: Effect
  onEdit?: (expense: Expense) => void
}) {
  const deleteExpense = useAppStore((state) => state.deleteExpense)
  const [open, setOpen] = useState(false)
  const detailsId = `expense-${expense.id}`

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
        <EffectLabel effect={effect} />
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div id={detailsId} className="border-t px-4 py-4 text-sm sm:pl-[6.5rem]">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Date</dt>
            <dd>{longDate(expense.date)}</dd>
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
          {onEdit && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(expense)}>
                <Pencil aria-hidden="true" />
                Edit
              </Button>
              <ConfirmDeleteButton
                title={`Delete “${expense.description}”?`}
                description="This removes the expense for everyone in the group and updates their balances. It can't be undone."
                onConfirm={() => {
                  deleteExpense(expense.id)
                  toast.success('Expense deleted')
                }}
              />
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function SettlementRow({
  data,
  settlement,
  onEdit,
}: {
  data: AppData
  settlement: Settlement
  onEdit?: (settlement: Settlement) => void
}) {
  const deleteSettlement = useAppStore((state) => state.deleteSettlement)
  const [open, setOpen] = useState(false)
  const detailsId = `settlement-${settlement.id}`
  const to = shortName(data, settlement.toId)
  const summary = `${shortName(data, settlement.fromId)} paid ${to === 'You' ? 'you' : to}`

  return (
    <li className="rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:gap-4 sm:px-4"
      >
        <DateStamp date={settlement.date} />
        <span className="flex size-10 shrink-0 items-center justify-center">
          <Banknote className="size-5 text-primary" aria-hidden="true" />
        </span>
        <span className="flex-1">
          {summary} <span className="font-medium text-foreground tabular-nums">{formatPaise(settlement.amount)}</span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div id={detailsId} className="mx-3 mb-2 rounded-xl border bg-card px-4 py-4 text-sm sm:ml-[6.5rem]">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Paid by</dt>
            <dd>{personName(data, settlement.fromId)}</dd>
            <dt className="text-muted-foreground">Paid to</dt>
            <dd>{personName(data, settlement.toId)}</dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="tabular-nums">{formatPaise(settlement.amount)}</dd>
            <dt className="text-muted-foreground">Date</dt>
            <dd>{longDate(settlement.date)}</dd>
          </dl>
          {onEdit && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(settlement)}>
                <Pencil aria-hidden="true" />
                Edit
              </Button>
              <ConfirmDeleteButton
                title="Delete this payment?"
                description={`${summary} ${formatPaise(settlement.amount)}. Deleting it brings back the debt it paid off. It can't be undone.`}
                onConfirm={() => {
                  deleteSettlement(settlement.id)
                  toast.success('Payment deleted')
                }}
              />
            </div>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * A month-grouped list of Expenses and Settlements. `effectFor` decides the
 * amount each Expense row shows; leaving out the edit callbacks makes rows read-only.
 */
export function Timeline({
  data,
  months,
  effectFor,
  onEditExpense,
  onEditSettlement,
}: {
  data: AppData
  months: TimelineMonth[]
  effectFor: (expense: Expense) => Effect
  onEditExpense?: (expense: Expense) => void
  onEditSettlement?: (settlement: Settlement) => void
}) {
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
                <ExpenseRow
                  key={item.record.id}
                  data={data}
                  expense={item.record}
                  effect={effectFor(item.record)}
                  onEdit={onEditExpense}
                />
              ) : (
                <SettlementRow key={item.record.id} data={data} settlement={item.record} onEdit={onEditSettlement} />
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  )
}
