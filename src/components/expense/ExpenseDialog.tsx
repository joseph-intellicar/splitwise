import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { CategoryIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, DEFAULT_CATEGORY_ID } from '@/domain/categories'
import {
  canSaveDraft,
  draftFromExpense,
  draftShares,
  expenseFromDraft,
  hasOtherSharer,
  leftToAssign,
  leftToAssignText,
  switchToExact,
  todayIso,
  type ExpenseDraft,
} from '@/domain/expenseDraft'
import { formatPaise, parseRupees } from '@/domain/money'
import { personName } from '@/domain/people'
import type { AppData, Expense, Group, PersonId } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'
import { useAppStore } from '@/store/appStore'

/** A fresh draft; `tickedIds` limits who starts ticked (everyone by default). */
function newDraft(group: Group, tickedIds?: PersonId[]): ExpenseDraft {
  const ticked = tickedIds ? group.memberIds.filter((id) => tickedIds.includes(id)) : [...group.memberIds]
  return {
    groupId: group.id,
    description: '',
    amountText: '',
    categoryId: DEFAULT_CATEGORY_ID,
    date: todayIso(),
    notes: '',
    payerId: ticked.includes(CURRENT_USER_ID) ? CURRENT_USER_ID : (ticked[0] ?? null),
    involvedIds: ticked,
    splitMethod: 'equal',
    splitIds: [...ticked],
    exactTexts: {},
  }
}

/** Name for pickers: "You" for the Current User, otherwise the full name. */
function pickerName(data: AppData, personId: PersonId) {
  return personId === CURRENT_USER_ID ? 'You' : personName(data, personId)
}

function ExpenseForm({
  data,
  initialGroup,
  groupOptions,
  tickedIds,
  expense,
  onDone,
}: {
  data: AppData
  initialGroup: Group
  groupOptions: Group[]
  tickedIds?: PersonId[]
  expense?: Expense
  onDone: () => void
}) {
  const addExpense = useAppStore((state) => state.addExpense)
  const updateExpense = useAppStore((state) => state.updateExpense)
  const [draft, setDraft] = useState(() => (expense ? draftFromExpense(expense) : newDraft(initialGroup, tickedIds)))
  const group = data.groups.find((g) => g.id === draft.groupId) ?? initialGroup
  const today = todayIso()
  const shares = draftShares(draft, group)
  const hasAmount = (parseRupees(draft.amountText) ?? 0) > 0
  const exact = draft.splitMethod === 'exact'
  const left = leftToAssign(draft, group)
  const involved = group.memberIds.filter((id) => draft.involvedIds.includes(id))
  const update = (changes: Partial<ExpenseDraft>) => setDraft((d) => ({ ...d, ...changes }))

  function toggleInvolved(personId: PersonId, ticked: boolean) {
    setDraft((d) => {
      const involvedIds = ticked ? [...d.involvedIds, personId] : d.involvedIds.filter((id) => id !== personId)
      const splitIds = ticked ? [...d.splitIds, personId] : d.splitIds.filter((id) => id !== personId)
      const ordered = group.memberIds.filter((id) => involvedIds.includes(id))
      const payerId = d.payerId && involvedIds.includes(d.payerId) ? d.payerId : (ordered[0] ?? null)
      return { ...d, involvedIds, splitIds, payerId }
    })
  }

  function toggleSplit(personId: PersonId, ticked: boolean) {
    setDraft((d) => ({
      ...d,
      splitIds: ticked ? [...d.splitIds, personId] : d.splitIds.filter((id) => id !== personId),
    }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSaveDraft(draft, group, today)) return
    if (expense) {
      // The Group can't change once an Expense exists.
      const { groupId: _groupId, ...changes } = expenseFromDraft(draft, group)
      updateExpense(expense.id, changes)
      toast.success('Expense updated')
    } else {
      addExpense(expenseFromDraft(draft, group))
      toast.success(`Expense added to ${group.name}`)
    }
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-group">Group</Label>
        <Select
          value={draft.groupId}
          disabled={!!expense}
          onValueChange={(groupId) => setDraft(newDraft(groupOptions.find((g) => g.id === groupId)!, tickedIds))}
        >
          <SelectTrigger id="expense-group" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupOptions.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Who's involved</legend>
        <div className="flex flex-wrap gap-2">
          {group.memberIds.map((personId) => {
            const id = `involved-${personId}`
            return (
              <label
                key={personId}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/10"
              >
                <Checkbox
                  id={id}
                  checked={draft.involvedIds.includes(personId)}
                  onCheckedChange={(checked) => toggleInvolved(personId, checked === true)}
                />
                {pickerName(data, personId)}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="expense-description">Description</Label>
          <Input
            id="expense-description"
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="e.g. Dinner at Toit"
            required
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2 sm:w-48">
          <Label htmlFor="expense-amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted-foreground" aria-hidden="true">
              ₹
            </span>
            <Input
              id="expense-amount"
              inputMode="decimal"
              value={draft.amountText}
              onChange={(e) => update({ amountText: e.target.value })}
              placeholder="0.00"
              className="h-11 pl-8 text-xl font-semibold tabular-nums md:text-xl"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-category">Category</Label>
          <Select value={draft.categoryId} onValueChange={(categoryId) => update({ categoryId })}>
            <SelectTrigger id="expense-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <CategoryIcon categoryId={c.id} className="size-6 rounded-md [&_svg]:size-3.5" />
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            max={today}
            value={draft.date}
            onChange={(e) => update({ date: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expense-notes">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="expense-notes" value={draft.notes} onChange={(e) => update({ notes: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Label htmlFor="expense-payer" className="font-normal">
            Paid by
          </Label>
          <Select value={draft.payerId ?? ''} onValueChange={(payerId) => update({ payerId })}>
            <SelectTrigger id="expense-payer" size="sm" className="bg-background font-medium">
              <SelectValue placeholder="Choose who paid" />
            </SelectTrigger>
            <SelectContent>
              {involved.map((personId) => (
                <SelectItem key={personId} value={personId}>
                  {pickerName(data, personId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="expense-split-method" className="font-normal">
            and split
          </Label>
          <Select
            value={draft.splitMethod}
            onValueChange={(method) =>
              setDraft((d) => (method === 'exact' ? switchToExact(d, group) : { ...d, splitMethod: 'equal' }))
            }
          >
            <SelectTrigger id="expense-split-method" size="sm" className="bg-background font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal">equally</SelectItem>
              <SelectItem value="exact">by exact amounts</SelectItem>
            </SelectContent>
          </Select>
        </p>

        <fieldset>
          <legend className="sr-only">{exact ? 'Exact Shares' : 'Split equally between'}</legend>
          {involved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tick who's involved above.</p>
          ) : (
            <ul className="flex flex-col">
              {involved.map((personId) => {
                const id = `split-${personId}`
                const share = shares.find((s) => s.personId === personId)
                if (exact) {
                  return (
                    <li key={personId} className="flex items-center gap-3 py-1">
                      <Label htmlFor={id} className="flex-1 font-normal">
                        {pickerName(data, personId)}
                      </Label>
                      <div className="relative w-32">
                        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
                          ₹
                        </span>
                        <Input
                          id={id}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="bg-background pl-6 text-right tabular-nums"
                          value={draft.exactTexts[personId] ?? ''}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, exactTexts: { ...d.exactTexts, [personId]: e.target.value } }))
                          }
                        />
                      </div>
                    </li>
                  )
                }
                return (
                  <li key={personId} className="flex items-center gap-3 py-1.5">
                    <Checkbox
                      id={id}
                      checked={draft.splitIds.includes(personId)}
                      onCheckedChange={(checked) => toggleSplit(personId, checked === true)}
                    />
                    <Label htmlFor={id} className="flex-1 font-normal">
                      {pickerName(data, personId)}
                    </Label>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {!hasAmount ? '—' : share ? formatPaise(share.amount) : 'no share'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        <div aria-live="polite" className="flex flex-col gap-1 text-sm empty:hidden">
          {exact && hasAmount && (
            <p className={left === 0 ? 'text-muted-foreground' : 'font-medium text-owe'}>{leftToAssignText(left)}</p>
          )}
          {hasAmount && !hasOtherSharer(draft, group) && (
            <p className="font-medium text-owe">Split with at least one other person.</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSaveDraft(draft, group, today)}>
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Opened without a Group: the user chooses one first, then the full form appears. */
function ChooseGroupFirst({ groups, onChoose, onCancel }: { groups: Group[]; onChoose: (group: Group) => void; onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-group">Group</Label>
        <Select value="" onValueChange={(groupId) => onChoose(groups.find((g) => g.id === groupId)!)}>
          <SelectTrigger id="expense-group" className="w-full">
            <SelectValue placeholder="Choose a group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Every expense belongs to a group. Choose one to continue.</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled>
          Save
        </Button>
      </DialogFooter>
    </div>
  )
}

/**
 * Adds a new Expense, or edits `expense` when one is given. Without a `group`
 * the user chooses one first. `groupOptions` limits the Group picker (all
 * Groups by default) and `tickedIds` who starts ticked.
 */
export function ExpenseDialog({
  open,
  onOpenChange,
  group,
  groupOptions,
  tickedIds,
  expense,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group
  groupOptions?: Group[]
  tickedIds?: PersonId[]
  expense?: Expense
}) {
  const data = useAppStore((state) => state.data)
  const [chosenGroup, setChosenGroup] = useState<Group | null>(null)
  const startGroup = group ?? chosenGroup
  const close = () => {
    onOpenChange(false)
    setChosenGroup(null)
  }
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Add an expense'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Change any detail; the group stays the same.' : "Record a shared cost and how it's split."}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted on every open, so each expense starts from a fresh draft. */}
        {open &&
          (startGroup ? (
            <ExpenseForm
              data={data}
              initialGroup={startGroup}
              groupOptions={groupOptions ?? data.groups}
              tickedIds={tickedIds}
              expense={expense}
              onDone={close}
            />
          ) : (
            <ChooseGroupFirst groups={groupOptions ?? data.groups} onChoose={setChosenGroup} onCancel={close} />
          ))}
      </DialogContent>
    </Dialog>
  )
}
