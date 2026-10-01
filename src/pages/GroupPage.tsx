import { Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'

import { ExpenseDialog } from '@/components/expense/ExpenseDialog'
import { GroupBalances } from '@/components/group/GroupBalances'
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog'
import { GroupTypeIcon } from '@/components/icons'
import { Timeline } from '@/components/Timeline'
import { SettleUpDialog } from '@/components/settlement/SettleUpDialog'
import { Button } from '@/components/ui/button'
import { expenseEffect, groupDebts } from '@/domain/balances'
import { groupTimeline } from '@/domain/timeline'
import type { Expense, Settlement } from '@/domain/types'
import { useAppStore } from '@/store/appStore'

import { NotFoundPage } from './NotFoundPage'

export function GroupPage() {
  const { groupId } = useParams()
  const data = useAppStore((state) => state.data)
  const group = data.groups.find((g) => g.id === groupId)
  const [addingExpense, setAddingExpense] = useState(false)
  const [settlingUp, setSettlingUp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  // Records being edited are kept after closing so the dialogs don't flip to "Add" while they animate out.
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editing, setEditing] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null)
  const [editingPayment, setEditingPayment] = useState(false)

  if (!group) return <NotFoundPage />

  const memberCount = group.memberIds.length

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <GroupTypeIcon type={group.type} />
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-semibold tracking-tight">{group.name}</h1>
            <p className="text-sm text-muted-foreground">
              {memberCount} {memberCount === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddingExpense(true)}>
            <Plus aria-hidden="true" />
            Add an expense
          </Button>
          <Button variant="outline" onClick={() => setSettlingUp(true)}>
            Settle up
          </Button>
          <Button variant="ghost" size="icon" aria-label="Group settings" onClick={() => setShowSettings(true)}>
            <Settings aria-hidden="true" />
          </Button>
        </div>
      </header>

      <GroupBalances data={data} group={group} debts={groupDebts(data, group.id)} />

      <Timeline
        data={data}
        months={groupTimeline(data, group.id)}
        effectFor={expenseEffect}
        onEditExpense={(expense) => {
          setEditingExpense(expense)
          setEditing(true)
        }}
        onEditSettlement={(settlement) => {
          setEditingSettlement(settlement)
          setEditingPayment(true)
        }}
      />

      <ExpenseDialog open={addingExpense} onOpenChange={setAddingExpense} group={group} />
      <ExpenseDialog
        open={editing}
        onOpenChange={setEditing}
        group={group}
        expense={editingExpense ?? undefined}
      />
      <SettleUpDialog open={settlingUp} onOpenChange={setSettlingUp} group={group} />
      <GroupSettingsDialog open={showSettings} onOpenChange={setShowSettings} group={group} />
      <SettleUpDialog
        open={editingPayment}
        onOpenChange={setEditingPayment}
        group={group}
        settlement={editingSettlement ?? undefined}
      />
    </div>
  )
}
