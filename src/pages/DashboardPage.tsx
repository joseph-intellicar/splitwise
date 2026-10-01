import { ChevronDown, PartyPopper, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { BalanceText } from '@/components/Amounts'
import { Avatar } from '@/components/Avatar'
import { ExpenseDialog } from '@/components/expense/ExpenseDialog'
import { GroupTypeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { groupBalance, isMemberSettledUp } from '@/domain/balances'
import { dashboardFigures, isEverythingSettled, type FriendAmount } from '@/domain/dashboard'
import { friendBreakdown } from '@/domain/friendBalances'
import { formatPaise } from '@/domain/money'
import type { AppData, Group, Paise } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

function Figure({ label, amount, tone }: { label: string; amount: string; tone: 'owe' | 'get-back' | 'neutral' }) {
  return (
    <div className="rounded-2xl border bg-card p-5 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 font-heading text-2xl font-semibold tabular-nums sm:text-3xl',
          tone === 'owe' && 'text-owe',
          tone === 'get-back' && 'text-get-back',
        )}
      >
        {amount}
      </p>
    </div>
  )
}

function totalText(total: Paise) {
  if (total === 0) return formatPaise(0)
  return `${total > 0 ? '+' : '−'}${formatPaise(total)}`
}

function FriendEntry({ data, entry, direction }: { data: AppData; entry: FriendAmount; direction: 'owe' | 'get-back' }) {
  const [open, setOpen] = useState(false)
  const terms = friendBreakdown(data, entry.friend.id).filter((t) => t.amount !== 0)
  const detailsId = `breakdown-${entry.friend.id}`
  return (
    <li className="rounded-xl">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/50">
        <Link
          to={`/friends/${entry.friend.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Avatar name={entry.friend.name} className="size-9 text-sm" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{entry.friend.name}</span>
            <span className={cn('text-sm', direction === 'owe' ? 'text-owe' : 'text-get-back')}>
              {direction === 'owe' ? 'you owe ' : 'owes you '}
              <span className="font-semibold tabular-nums">{formatPaise(entry.amount)}</span>
            </span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={`${open ? 'Hide' : 'Show'} ${entry.friend.name} by group`}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDown className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </Button>
      </div>
      {open && (
        <ul id={detailsId} className="mb-2 ml-14 flex flex-col gap-1 border-l-2 pl-4 text-sm text-muted-foreground">
          {terms.map(({ group, amount }) => (
            <li key={group.id}>
              {group.name}: {amount > 0 ? 'you get back' : 'you owe'} {formatPaise(amount)}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function FriendList({
  data,
  title,
  entries,
  direction,
  emptyText,
}: {
  data: AppData
  title: string
  entries: FriendAmount[]
  direction: 'owe' | 'get-back'
  emptyText: string
}) {
  const id = `list-${direction}`
  return (
    <section aria-labelledby={id} className="rounded-2xl border bg-card p-4 text-card-foreground sm:p-5">
      <h2 id={id} className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => (
            <FriendEntry key={entry.friend.id} data={data} entry={entry} direction={direction} />
          ))}
        </ul>
      )}
    </section>
  )
}

function GroupCard({ data, group }: { data: AppData; group: Group }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="flex items-center gap-4 rounded-2xl border bg-card p-4 text-card-foreground transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <GroupTypeIcon type={group.type} className="size-11" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{group.name}</span>
        <span className="text-sm">
          <BalanceText
            balance={groupBalance(data, group.id, CURRENT_USER_ID)}
            settledUp={isMemberSettledUp(data, group.id, CURRENT_USER_ID)}
            you
          />
        </span>
      </span>
    </Link>
  )
}

export function DashboardPage() {
  const data = useAppStore((state) => state.data)
  const [addingExpense, setAddingExpense] = useState(false)
  const figures = dashboardFigures(data)
  const groups = [...data.groups].sort((a, b) => a.name.localeCompare(b.name))
  const canAdd = data.groups.length > 0
  // Settled Up means no open Debt anywhere, not just figures that net to ₹0.
  const allSettled = isEverythingSettled(data)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <h1 className="flex-1 font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Button onClick={() => setAddingExpense(true)} disabled={!canAdd}>
          <Plus aria-hidden="true" />
          Add an expense
        </Button>
      </header>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        <Figure label="You owe" amount={formatPaise(figures.youOwe)} tone={figures.youOwe > 0 ? 'owe' : 'neutral'} />
        <Figure
          label="You get back"
          amount={formatPaise(figures.youGetBack)}
          tone={figures.youGetBack > 0 ? 'get-back' : 'neutral'}
        />
        <Figure
          label="Total balance"
          amount={totalText(figures.total)}
          tone={figures.total > 0 ? 'get-back' : figures.total < 0 ? 'owe' : 'neutral'}
        />
      </section>

      {allSettled ? (
        <section className="flex flex-col items-center rounded-2xl border bg-card px-6 py-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-get-back/10 text-get-back">
            <PartyPopper className="size-8" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold">You're all settled up</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nobody owes anybody. Add an expense when something new comes up.</p>
          <Button className="mt-6" onClick={() => setAddingExpense(true)} disabled={!canAdd}>
            <Plus aria-hidden="true" />
            Add an expense
          </Button>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <FriendList data={data} title="You owe" entries={figures.owe} direction="owe" emptyText="You don't owe anyone." />
          <FriendList
            data={data}
            title="You get back"
            entries={figures.getBack}
            direction="get-back"
            emptyText="Nobody owes you anything."
          />
        </div>
      )}

      {groups.length > 0 && (
        <section aria-labelledby="your-groups">
          <h2 id="your-groups" className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Your groups
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} data={data} group={group} />
            ))}
          </div>
        </section>
      )}

      <ExpenseDialog open={addingExpense} onOpenChange={setAddingExpense} />
    </div>
  )
}
