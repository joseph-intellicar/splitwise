import type { AppData, Expense, Settlement } from './types'

export type TimelineItem =
  | { kind: 'expense'; record: Expense }
  | { kind: 'settlement'; record: Settlement }

export interface TimelineMonth {
  /** YYYY-MM */
  month: string
  label: string
  items: TimelineItem[]
}

const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Newest first by the date on the item; on the same date, most recently added first. */
function compareNewestFirst(a: TimelineItem, b: TimelineItem): number {
  if (a.record.date !== b.record.date) return a.record.date < b.record.date ? 1 : -1
  return a.record.createdAt < b.record.createdAt ? 1 : a.record.createdAt > b.record.createdAt ? -1 : 0
}

export function groupByMonth(items: TimelineItem[]): TimelineMonth[] {
  const months: TimelineMonth[] = []
  for (const item of [...items].sort(compareNewestFirst)) {
    const month = item.record.date.slice(0, 7)
    let current = months.at(-1)
    if (current?.month !== month) {
      current = { month, label: monthLabel.format(new Date(`${month}-01T00:00:00Z`)), items: [] }
      months.push(current)
    }
    current.items.push(item)
  }
  return months
}

/** A Group's full history, grouped by month. */
export function groupTimeline(data: AppData, groupId: string): TimelineMonth[] {
  return groupByMonth([
    ...data.expenses.filter((e) => e.groupId === groupId).map((record) => ({ kind: 'expense' as const, record })),
    ...data.settlements
      .filter((s) => s.groupId === groupId)
      .map((record) => ({ kind: 'settlement' as const, record })),
  ])
}
