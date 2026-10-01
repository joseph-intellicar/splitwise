import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ExpenseDialog } from '@/components/expense/ExpenseDialog'
import { SettleUpDialog } from '@/components/settlement/SettleUpDialog'
import { Timeline } from '@/components/Timeline'
import { Button } from '@/components/ui/button'
import { expenseEffect } from '@/domain/balances'
import { allExpensesTimeline } from '@/domain/timeline'
import type { Expense, Settlement } from '@/domain/types'
import { useAppStore } from '@/store/appStore'

export function AllExpensesPage() {
  const data = useAppStore((state) => state.data)
  const [addingExpense, setAddingExpense] = useState(false)
  // Records being edited are kept after closing so the dialogs don't change while they animate out.
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editing, setEditing] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null)
  const [editingPayment, setEditingPayment] = useState(false)
  const groupOf = (groupId: string) => data.groups.find((g) => g.id === groupId)
  const expenseGroup = editingExpense && groupOf(editingExpense.groupId)
  const settlementGroup = editingSettlement && groupOf(editingSettlement.groupId)
  const months = allExpensesTimeline(data)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">All expenses</h1>
          <p className="text-sm text-muted-foreground">Everything you paid for, shared in, or settled, across all your groups.</p>
        </div>
        <Button onClick={() => setAddingExpense(true)} disabled={data.groups.length === 0}>
          <Plus aria-hidden="true" />
          Add an expense
        </Button>
      </header>

      <Timeline
        data={data}
        months={months}
        effectFor={expenseEffect}
        showGroup
        onEditExpense={(expense) => {
          setEditingExpense(expense)
          setEditing(true)
        }}
        onEditSettlement={(settlement) => {
          setEditingSettlement(settlement)
          setEditingPayment(true)
        }}
      />

      <ExpenseDialog open={addingExpense} onOpenChange={setAddingExpense} />
      {expenseGroup && (
        <ExpenseDialog open={editing} onOpenChange={setEditing} group={expenseGroup} expense={editingExpense} />
      )}
      {settlementGroup && (
        <SettleUpDialog
          open={editingPayment}
          onOpenChange={setEditingPayment}
          group={settlementGroup}
          settlement={editingSettlement}
        />
      )}
    </div>
  )
}
