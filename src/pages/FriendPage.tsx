import { Check, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { Avatar } from '@/components/Avatar'
import { ExpenseDialog } from '@/components/expense/ExpenseDialog'
import { FriendDialog } from '@/components/friends/FriendDialog'
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog'
import { SettleUpDialog } from '@/components/settlement/SettleUpDialog'
import { Timeline } from '@/components/Timeline'
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
import type { Effect } from '@/domain/balances'
import {
  actionGroups,
  friendBalance,
  friendBreakdown,
  friendTimeline,
  isSettledUpWithFriend,
  mostRecentlyActive,
  pairwiseEffect,
  type GroupTerm,
} from '@/domain/friendBalances'
import { formatPaise } from '@/domain/money'
import type { Expense, Friend, Paise } from '@/domain/types'
import { CURRENT_USER_ID } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

import { NotFoundPage } from './NotFoundPage'

function termText(amount: Paise) {
  return amount > 0 ? `you get back ${formatPaise(amount)}` : `you owe ${formatPaise(amount)}`
}

function BalanceCard({ friend, balance, terms }: { friend: Friend; balance: Paise; terms: GroupTerm[] }) {
  const firstName = friend.name.split(' ')[0]
  const getBack = balance > 0
  return (
    <section aria-labelledby="friend-balance" className="rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
      <h2 id="friend-balance" className="sr-only">
        Balance
      </h2>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="sm:w-64 sm:shrink-0">
          {balance === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Your balance with {firstName}</p>
              <p className="font-heading text-3xl font-semibold tabular-nums">₹0.00 net</p>
              <p className="mt-1 text-sm text-muted-foreground">Your debts in different groups cancel out, but they're still open.</p>
            </>
          ) : (
            <>
              <p className={cn('text-sm', getBack ? 'text-get-back' : 'text-owe')}>
                {getBack ? `You get back from ${firstName}` : `You owe ${firstName}`}
              </p>
              <p className={cn('font-heading text-4xl font-semibold tabular-nums', getBack ? 'text-get-back' : 'text-owe')}>
                {formatPaise(balance)}
              </p>
            </>
          )}
        </div>
        <ul className="flex flex-1 flex-col gap-2" aria-label="By group">
          {terms.map(({ group, amount }) => (
            <li key={group.id} className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="font-medium">{group.name}</span>
              <span className={amount > 0 ? 'text-get-back' : 'text-owe'}>{termText(amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Edit details, or remove the Friend: only possible when you share no Group (current or former). */
function ManageFriend({ friend, blockedBy, onEdit }: { friend: Friend; blockedBy: string | null; onEdit: () => void }) {
  const sharesGroups = blockedBy !== null
  const removeFriend = useAppStore((state) => state.removeFriend)
  const navigate = useNavigate()
  const firstName = friend.name.split(' ')[0]

  return (
    <section aria-labelledby="manage-friend" className="rounded-2xl border p-5">
      <h2 id="manage-friend" className="font-heading font-semibold">
        Manage {firstName}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={onEdit}>
          <Pencil aria-hidden="true" />
          Edit details
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={sharesGroups} aria-describedby={sharesGroups ? 'remove-friend-hint' : undefined}>
              <Trash2 aria-hidden="true" />
              Remove friend
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {friend.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {firstName} will be removed from your friends. You can add them again later. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  // Leave the page first, so it never renders a Friend who's gone.
                  navigate('/')
                  removeFriend(friend.id)
                  toast.success(`${friend.name} removed from your friends`)
                }}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {sharesGroups && (
        <p id="remove-friend-hint" className="mt-2 text-sm text-muted-foreground">
          {blockedBy}
        </p>
      )}
    </section>
  )
}

export function FriendPage() {
  const { friendId } = useParams()
  const data = useAppStore((state) => state.data)
  const friend = data.friends.find((f) => f.id === friendId)
  const [showSettled, setShowSettled] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [settlingUp, setSettlingUp] = useState(false)
  const [editingFriend, setEditingFriend] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)

  if (!friend) return <NotFoundPage />

  const terms = friendBreakdown(data, friend.id)
  const hasSharedGroups = terms.length > 0
  // Only Groups where the Friend is still a member can take new Expenses or Settlements.
  const groupsForActions = actionGroups(data, friend.id)
  const defaultGroup = mostRecentlyActive(data, groupsForActions)
  const actionTerms = terms.filter((t) => groupsForActions.includes(t.group))
  const settledUp = isSettledUpWithFriend(data, friend.id)
  // Why Remove friend is unavailable, if it is: any shared Group, even one they've left, still shows them.
  const formerOnly = terms.map((t) => t.group).filter((g) => !groupsForActions.includes(g))
  const removeBlockedBy = !hasSharedGroups
    ? null
    : groupsForActions.length > 0
      ? `You can't remove ${friend.name.split(' ')[0]} while you share a group.`
      : `You can't remove ${friend.name.split(' ')[0]}: they're still on past expenses in ${formerOnly.map((g) => g.name).join(', ')}.`
  const contact = friend.email ?? friend.phone
  const firstName = friend.name.split(' ')[0]
  const effectFor = (expense: Expense): Effect => {
    const amount = pairwiseEffect(expense, friend.id)
    return amount >= 0 ? { kind: 'get-back', amount } : { kind: 'owe', amount: -amount }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar name={friend.name} />
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-semibold tracking-tight">{friend.name}</h1>
            {contact && <p className="truncate text-sm text-muted-foreground">{contact}</p>}
          </div>
        </div>
        {defaultGroup && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddingExpense(true)}>
              <Plus aria-hidden="true" />
              Add an expense
            </Button>
            <Button variant="outline" onClick={() => setSettlingUp(true)}>
              Settle up
            </Button>
          </div>
        )}
      </header>

      {!hasSharedGroups ? (
        <section className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UsersRound className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-lg font-semibold">No shared groups yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Expenses with {firstName} happen in a group. Create one together to start sharing costs.
          </p>
          <Button className="mt-6" onClick={() => setCreatingGroup(true)}>
            Create group with {firstName}
          </Button>
        </section>
      ) : settledUp ? (
        <>
          <section className="flex flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-get-back/10 text-get-back">
              <Check className="size-9" strokeWidth={3} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-heading text-xl font-semibold">You and {firstName} are all settled up</h2>
            <Button variant="link" className="mt-2" aria-expanded={showSettled} onClick={() => setShowSettled((s) => !s)}>
              {showSettled ? 'Hide settled expenses' : 'Show settled expenses'}
            </Button>
          </section>
          {showSettled && <Timeline data={data} months={friendTimeline(data, friend.id)} effectFor={effectFor} />}
        </>
      ) : (
        <>
          <BalanceCard friend={friend} balance={friendBalance(data, friend.id)} terms={terms.filter((t) => t.amount !== 0)} />
          <Timeline data={data} months={friendTimeline(data, friend.id)} effectFor={effectFor} />
        </>
      )}

      <ManageFriend friend={friend} blockedBy={removeBlockedBy} onEdit={() => setEditingFriend(true)} />

      <FriendDialog open={editingFriend} onOpenChange={setEditingFriend} friend={friend} />
      <CreateGroupDialog
        open={creatingGroup}
        onOpenChange={setCreatingGroup}
        initialMembers={[{ kind: 'friend', friendId: friend.id }]}
      />
      {defaultGroup && (
        <>
          <ExpenseDialog
            open={addingExpense}
            onOpenChange={setAddingExpense}
            group={defaultGroup}
            groupOptions={groupsForActions}
            tickedIds={[CURRENT_USER_ID, friend.id]}
          />
          <SettleUpDialog
            open={settlingUp}
            onOpenChange={setSettlingUp}
            group={defaultGroup}
            friend={{ friendId: friend.id, terms: actionTerms }}
          />
        </>
      )}
    </div>
  )
}
