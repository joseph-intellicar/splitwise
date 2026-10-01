import { LayoutDashboard, ListOrdered, Plus, Settings } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'

import { Logo } from '@/components/Logo'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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

function SectionHeading({ title, addLabel }: { title: string; addLabel: string }) {
  return (
    <div className="flex items-center justify-between px-3 pt-4 pb-1">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {/* Wired up by the create-group and add-friend tickets. */}
      <button
        type="button"
        disabled
        aria-label={addLabel}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground disabled:opacity-60"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        add
      </button>
    </div>
  )
}

export function SidebarNav() {
  const [filter, setFilter] = useState('')

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

        <SectionHeading title="Groups" addLabel="Add group" />
        <p className="px-3 py-1 text-sm text-muted-foreground">No groups yet</p>

        <SectionHeading title="Friends" addLabel="Add friend" />
        <p className="px-3 py-1 text-sm text-muted-foreground">No friends yet</p>
      </nav>

      <div className="border-t border-sidebar-border pt-2">
        <NavItem to="/settings" icon={<Settings className="size-4" aria-hidden="true" />}>
          Settings
        </NavItem>
      </div>
    </div>
  )
}
