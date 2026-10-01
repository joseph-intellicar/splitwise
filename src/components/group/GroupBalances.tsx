import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { BalanceText } from '@/components/Amounts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { debtsOf, groupBalance, type Debt } from '@/domain/balances'
import { formatPaise } from '@/domain/money'
import { personName, shortName } from '@/domain/people'
import type { AppData, Group, Paise, PersonId } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'
import { cn } from '@/lib/utils'

const TOP_FEW = 3

interface MemberBalance {
  personId: PersonId
  balance: Paise
  debts: Debt[]
}

function debtSentence(data: AppData, debt: Debt): string {
  const debtor = shortName(data, debt.debtorId)
  const creditor = debt.creditorId === CURRENT_USER_ID ? 'you' : shortName(data, debt.creditorId)
  const verb = debt.debtorId === CURRENT_USER_ID ? 'owe' : 'owes'
  return `${debtor} ${verb} ${creditor} ${formatPaise(debt.amount)}`
}

function MemberRow({ data, member }: { data: AppData; member: MemberBalance }) {
  const [open, setOpen] = useState(false)
  const you = member.personId === CURRENT_USER_ID
  const name = you ? 'You' : personName(data, member.personId)
  const detailsId = `debts-${member.personId}`

  return (
    <li className="rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        disabled={member.debts.length === 0}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className="flex-1 truncate font-medium">{name}</span>
        <span className="text-sm">
          <BalanceText balance={member.balance} settledUp={member.debts.length === 0} you={you} />
        </span>
        {member.debts.length > 0 && (
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
        )}
      </button>
      {open && (
        <ul id={detailsId} className="mb-2 ml-3 flex flex-col gap-1 border-l-2 pl-4 text-sm text-muted-foreground">
          {member.debts.map((debt) => (
            <li key={`${debt.debtorId}-${debt.creditorId}`}>{debtSentence(data, debt)}</li>
          ))}
        </ul>
      )}
    </li>
  )
}

function YourBalance({ balance, settledUp }: { balance: Paise; settledUp: boolean }) {
  if (settledUp) {
    return <p className="font-heading text-3xl font-semibold text-not-involved">You're settled up</p>
  }
  if (balance === 0) {
    return (
      <>
        <p className="text-sm text-muted-foreground">Your balance</p>
        <p className="font-heading text-3xl font-semibold tabular-nums">₹0.00 net</p>
        <p className="mt-1 text-sm text-muted-foreground">You still have open debts in this group.</p>
      </>
    )
  }
  const getBack = balance > 0
  return (
    <>
      <p className={cn('text-sm', getBack ? 'text-get-back' : 'text-owe')}>{getBack ? 'You get back' : 'You owe'}</p>
      <p className={cn('font-heading text-4xl font-semibold tabular-nums', getBack ? 'text-get-back' : 'text-owe')}>
        {formatPaise(balance)}
      </p>
    </>
  )
}

/** Balance summary card: your Group Balance in large type, then the top few others, with the full list behind a dialog. */
export function GroupBalances({ data, group, debts }: { data: AppData; group: Group; debts: Debt[] }) {
  const [allOpen, setAllOpen] = useState(false)
  const members: MemberBalance[] = group.memberIds.map((personId) => ({
    personId,
    balance: groupBalance(data, group.id, personId),
    debts: debtsOf(debts, personId),
  }))
  const you = members.find((m) => m.personId === CURRENT_USER_ID)!
  const topOthers = members
    .filter((m) => m.personId !== CURRENT_USER_ID && m.balance !== 0)
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, TOP_FEW)

  return (
    <section aria-labelledby="group-balances" className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
      <h2 id="group-balances" className="sr-only">
        Balances
      </h2>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="lg:w-64 lg:shrink-0">
          <YourBalance balance={you.balance} settledUp={you.debts.length === 0} />
          {you.debts.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
              {you.debts.map((debt) => (
                <li key={`${debt.debtorId}-${debt.creditorId}`}>{debtSentence(data, debt)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1">
          {topOthers.length > 0 ? (
            <ul className="flex flex-col">
              {topOthers.map((member) => (
                <MemberRow key={member.personId} data={data} member={member} />
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">Everyone else is settled up.</p>
          )}
          <Button variant="link" className="mt-1 px-3" onClick={() => setAllOpen(true)}>
            See all balances
          </Button>
        </div>
      </div>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All balances in {group.name}</DialogTitle>
            <DialogDescription>Expand a member to see who they owe and who owes them.</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col">
            {members.map((member) => (
              <MemberRow key={member.personId} data={data} member={member} />
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  )
}
