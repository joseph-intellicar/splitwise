import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Debt } from '@/domain/balances'
import { todayIso } from '@/domain/expenseDraft'
import { settleUpDefault, type GroupTerm } from '@/domain/friendBalances'
import { formatPaise } from '@/domain/money'
import { personName, shortName } from '@/domain/people'
import {
  canSaveSettlement,
  draftForDebt,
  draftFromSettlement,
  newSettlementDraft,
  settlementFromDraft,
  settleUpSuggestions,
  type SettlementDraft,
} from '@/domain/settlementDraft'
import type { AppData, Group, PersonId, Settlement } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

/** A draft paying back your whole Debt with `friendId` in one Group, or an empty one if there's none. */
function draftForTerm(term: GroupTerm, friendId: PersonId, date: string): SettlementDraft {
  const amount = Math.abs(term.amount)
  if (term.amount === 0) return { groupId: term.group.id, fromId: null, toId: null, amountText: '', date }
  const debt =
    term.amount < 0
      ? { debtorId: CURRENT_USER_ID, creditorId: friendId, amount }
      : { debtorId: friendId, creditorId: CURRENT_USER_ID, amount }
  return draftForDebt(term.group.id, debt, date)
}

function termLabel(term: GroupTerm) {
  if (term.amount === 0) return `${term.group.name} · settled up`
  return `${term.group.name} · ${term.amount > 0 ? 'you get back' : 'you owe'} ${formatPaise(term.amount)}`
}

/** "You owe Priya ₹400.00" / "Arjun owes you ₹200.00" */
function suggestionText(data: AppData, debt: Debt) {
  return debt.debtorId === CURRENT_USER_ID
    ? `You owe ${shortName(data, debt.creditorId)} ${formatPaise(debt.amount)}`
    : `${shortName(data, debt.debtorId)} owes you ${formatPaise(debt.amount)}`
}

function pickerName(data: AppData, personId: PersonId) {
  return personId === CURRENT_USER_ID ? 'You' : personName(data, personId)
}

function MemberSelect({
  id,
  data,
  group,
  value,
  onChange,
  placeholder,
}: {
  id: string
  data: AppData
  group: Group
  value: PersonId | null
  onChange: (personId: PersonId) => void
  placeholder: string
}) {
  // Only current members can take part; Former Members are never offered.
  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {group.memberIds.map((personId) => (
          <SelectItem key={personId} value={personId}>
            {pickerName(data, personId)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SettlementForm({
  data,
  initialGroup,
  friend,
  settlement,
  onDone,
}: {
  data: AppData
  initialGroup: Group
  friend?: FriendChoice
  settlement?: Settlement
  onDone: () => void
}) {
  const addSettlement = useAppStore((state) => state.addSettlement)
  const updateSettlement = useAppStore((state) => state.updateSettlement)
  const today = todayIso()
  const [draft, setDraft] = useState<SettlementDraft>(() => {
    if (settlement) return draftFromSettlement(settlement)
    const term = friend && settleUpDefault(friend.terms)
    if (friend && term) return draftForTerm(term, friend.friendId, today)
    return newSettlementDraft(data, initialGroup.id, today)
  })
  const group = data.groups.find((g) => g.id === draft.groupId) ?? initialGroup
  // From a Friend page the Group picker replaces the suggestion chips.
  const suggestions = settlement || friend ? [] : settleUpSuggestions(data, group.id)
  const update = (changes: Partial<SettlementDraft>) => setDraft((d) => ({ ...d, ...changes }))
  const isSuggestion = (debt: Debt) =>
    draft.fromId === debt.debtorId && draft.toId === debt.creditorId

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSaveSettlement(draft, group, today)) return
    if (settlement) {
      const { groupId: _groupId, ...changes } = settlementFromDraft(draft)
      updateSettlement(settlement.id, changes)
      toast.success('Payment updated')
    } else {
      addSettlement(settlementFromDraft(draft))
      toast.success(`Payment recorded in ${group.name}`)
    }
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {friend && !settlement && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="settlement-group">Group</Label>
          <Select
            value={draft.groupId}
            onValueChange={(groupId) =>
              setDraft(draftForTerm(friend.terms.find((t) => t.group.id === groupId)!, friend.friendId, draft.date))
            }
          >
            <SelectTrigger id="settlement-group" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {friend.terms.map((term) => (
                <SelectItem key={term.group.id} value={term.group.id}>
                  {termLabel(term)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!settlement && !friend && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Your open debts in {group.name}</legend>
          <div className="flex flex-wrap gap-2">
            {suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">You're settled up in this group.</p>
            )}
            {suggestions.map((debt) => (
              <button
                key={`${debt.debtorId}-${debt.creditorId}`}
                type="button"
                aria-pressed={isSuggestion(debt)}
                onClick={() => setDraft(draftForDebt(group.id, debt, draft.date))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isSuggestion(debt) && 'border-primary bg-primary/10',
                  debt.debtorId === CURRENT_USER_ID ? 'text-owe' : 'text-get-back',
                )}
              >
                {suggestionText(data, debt)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => update({ fromId: null, toId: null, amountText: '' })}
              className="rounded-full border border-dashed px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Record another payment
            </button>
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="settlement-from">Who paid</Label>
          <MemberSelect
            id="settlement-from"
            data={data}
            group={group}
            value={draft.fromId}
            onChange={(fromId) => update({ fromId })}
            placeholder="Choose who paid"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="settlement-to">Paid to</Label>
          <MemberSelect
            id="settlement-to"
            data={data}
            group={group}
            value={draft.toId}
            onChange={(toId) => update({ toId })}
            placeholder="Choose who was paid"
          />
        </div>
      </div>
      {draft.fromId !== null && draft.fromId === draft.toId && (
        <p className="-mt-3 text-sm font-medium text-owe">Choose two different people.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="settlement-amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted-foreground" aria-hidden="true">
              ₹
            </span>
            <Input
              id="settlement-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={draft.amountText}
              onChange={(e) => update({ amountText: e.target.value })}
              className="h-11 pl-8 text-xl font-semibold tabular-nums md:text-xl"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="settlement-date">Date</Label>
          <Input
            id="settlement-date"
            type="date"
            max={today}
            value={draft.date}
            onChange={(e) => update({ date: e.target.value })}
            className="h-11"
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSaveSettlement(draft, group, today)}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Settling up from a Friend page: your amount with them in each Group where they're a current member. */
export interface FriendChoice {
  friendId: PersonId
  terms: GroupTerm[]
}

/**
 * Records a new Settlement in `group`, or edits `settlement` when one is given.
 * With `friend`, a Group picker offers each shared Group with its amount pre-filled.
 */
export function SettleUpDialog({
  open,
  onOpenChange,
  group,
  friend,
  settlement,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  friend?: FriendChoice
  settlement?: Settlement
}) {
  const data = useAppStore((state) => state.data)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{settlement ? 'Edit payment' : 'Settle up'}</DialogTitle>
          <DialogDescription>
            {settlement
              ? `A payment in ${group.name}; the group stays the same.`
              : friend
                ? `Record a payment between you and ${shortName(data, friend.friendId)}.`
                : `Record a payment between two people in ${group.name}.`}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted on every open, so the pre-fill reflects the latest balances. */}
        {open && (
          <SettlementForm
            data={data}
            initialGroup={group}
            friend={friend}
            settlement={settlement}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
