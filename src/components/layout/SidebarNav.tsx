import { LayoutDashboard, ListOrdered, Plus, Settings } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'

import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog'
import { Logo } from '@/components/Logo'
import { Input } from '@/components/ui/input'
import { groupBalance, isMemberSettledUp } from '@/domain/balances'
import { friendBalance, isSettledUpWithFriend } from '@/domain/friendBalances'
import { formatPaise } from '@/domain/money'
import { CURRENT_USER_ID, type Paise } from '@/domain/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    isActive && 'bg-sidebar-accent font-medium text-sidebar-primary',
  )

/** Alphabetical, narrowed to names containing the filter text. */
function filterAndSort<T extends { name: string }>(items: T[], filter: string): T[] {
  const needle = filter.trim().toLocaleLowerCase()
  return items
    .filter((item) => item.name.toLocaleLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * A compact balance next to an entry, or nothing when Settled Up. The sign
 * and the hidden words carry the direction too, so colour is never the only signal.
 */
function BalanceHint({ balance }: { balance: Paise | null }) {
  if (balance === null) return null
  if (balance === 0) return <span className="shrink-0 text-xs tabular-nums text-not-involved">{formatPaise(0)}</span>
  const getBack = balance > 0
  return (
    <span className={cn('shrink-0 text-xs font-medium tabular-nums', getBack ? 'text-get-back' : 'text-owe')}>
      <span className="sr-only">{getBack ? 'you get back' : 'you owe'} </span>
      <span aria-hidden="true">{getBack ? '+' : '−'}</span>
      {formatPaise(balance)}
    </span>
  )
}

function EntryList({
  items,
  hasAny,
  emptyText,
  hrefFor,
  balanceFor,
}: {
  items: { id: string; name: string }[]
  hasAny: boolean
  emptyText: string
  hrefFor: (id: string) => string
  /** The balance to hint at, or null when Settled Up. */
  balanceFor: (id: string) => Paise | null
}) {
  if (items.length === 0) {
    return <p className="px-3 py-1 text-sm text-muted-foreground">{hasAny ? 'No matches' : emptyText}</p>
  }
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          <NavLink to={hrefFor(item.id)} className={linkClass}>
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            <BalanceHint balance={balanceFor(item.id)} />
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function NavItem({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          isActive && 'bg-sidebar-accent text-sidebar-primary',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  )
}

function SectionHeading({ title, addLabel, onAdd }: { title: string; addLabel: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 pt-4 pb-1">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {/* Disabled until its ticket wires it up. */}
      <button
        type="button"
        disabled={!onAdd}
        onClick={onAdd}
        aria-label={addLabel}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 disabled:hover:bg-transparent"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        add
      </button>
    </div>
  )
}

/** `onNavigate` lets the slide-out menu close when an action takes the user to another page. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [filter, setFilter] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const data = useAppStore((state) => state.data)
  const { groups, friends } = data
  // Settled Up (no open Debt) hides the hint; a net ₹0 with open Debts still shows ₹0.00.
  const groupHint = (groupId: string) =>
    isMemberSettledUp(data, groupId, CURRENT_USER_ID) ? null : groupBalance(data, groupId, CURRENT_USER_ID)
  const friendHint = (friendId: string) =>
    isSettledUpWithFriend(data, friendId) ? null : friendBalance(data, friendId)

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <Link
        to="/"
        className="rounded-md px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Logo />
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <NavItem to="/" icon={<LayoutDashboard className="size-4" aria-hidden="true" />}>
          Dashboard
        </NavItem>
        <NavItem to="/expenses" icon={<ListOrdered className="size-4" aria-hidden="true" />}>
          All expenses
        </NavItem>

        <div className="px-1 pt-4">
          <label htmlFor="sidebar-filter" className="sr-only">
            Filter groups and friends by name
          </label>
          <Input
            id="sidebar-filter"
            type="search"
            placeholder="Filter by name"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <SectionHeading title="Groups" addLabel="Add group" onAdd={() => setCreatingGroup(true)} />
        <EntryList
          items={filterAndSort(groups, filter)}
          hasAny={groups.length > 0}
          emptyText="No groups yet"
          hrefFor={(id) => `/groups/${id}`}
          balanceFor={groupHint}
        />

        <SectionHeading title="Friends" addLabel="Add friend" />
        <EntryList
          items={filterAndSort(friends, filter)}
          hasAny={friends.length > 0}
          emptyText="No friends yet"
          hrefFor={(id) => `/friends/${id}`}
          balanceFor={friendHint}
        />
      </nav>

      <div className="border-t border-sidebar-border pt-2">
        <NavItem to="/settings" icon={<Settings className="size-4" aria-hidden="true" />}>
          Settings
        </NavItem>
      </div>

      <CreateGroupDialog open={creatingGroup} onOpenChange={setCreatingGroup} onCreated={onNavigate} />
    </div>
  )
}
