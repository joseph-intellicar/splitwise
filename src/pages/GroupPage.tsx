import { Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'

import { AddExpenseDialog } from '@/components/expense/AddExpenseDialog'
import { GroupBalances } from '@/components/group/GroupBalances'
import { GroupTimeline } from '@/components/group/GroupTimeline'
import { GroupTypeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { groupDebts } from '@/domain/balances'
import { groupTimeline } from '@/domain/timeline'
import { useAppStore } from '@/store/appStore'

import { NotFoundPage } from './NotFoundPage'

export function GroupPage() {
  const { groupId } = useParams()
  const data = useAppStore((state) => state.data)
  const group = data.groups.find((g) => g.id === groupId)
  const [addingExpense, setAddingExpense] = useState(false)

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
          {/* Settle up and group settings are wired up by their own tickets. */}
          <Button variant="outline" disabled>
            Settle up
          </Button>
          <Button variant="ghost" size="icon" aria-label="Group settings" disabled>
            <Settings aria-hidden="true" />
          </Button>
        </div>
      </header>

      <GroupBalances data={data} group={group} debts={groupDebts(data, group.id)} />

      <GroupTimeline data={data} months={groupTimeline(data, group.id)} />

      <AddExpenseDialog open={addingExpense} onOpenChange={setAddingExpense} group={group} />
    </div>
  )
}
