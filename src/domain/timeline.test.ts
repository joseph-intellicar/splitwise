import { formatPaise } from './money'
import { createSeedData } from './seed'
import { allExpensesTimeline, groupByMonth, type TimelineItem } from './timeline'
import { CURRENT_USER_ID } from './types'

const item = (id: string, date: string, createdAt: string): TimelineItem => ({
  kind: 'settlement',
  record: { id, groupId: 'g', fromId: 'a', toId: 'b', amount: 100, date, createdAt },
})

describe('groupByMonth', () => {
  it('groups by month, newest first by date, and most recently added first on the same date', () => {
    const months = groupByMonth([
      item('may', '2026-05-30', '2026-05-30T09:00:00Z'),
      item('sep-early-added', '2026-09-10', '2026-09-01T09:00:00Z'),
      item('back-dated', '2026-09-02', '2026-09-20T09:00:00Z'),
      item('sep-late-added', '2026-09-10', '2026-09-15T09:00:00Z'),
    ])
    expect(months.map((m) => [m.label, m.items.map((i) => i.record.id)])).toEqual([
      ['September 2026', ['sep-late-added', 'sep-early-added', 'back-dated']],
      ['May 2026', ['may']],
    ])
  })
})

describe('formatPaise', () => {
  it('always shows two decimals with Indian digit grouping', () => {
    expect(formatPaise(123450)).toBe('₹1,234.50')
    expect(formatPaise(30000)).toBe('₹300.00')
    expect(formatPaise(-40000)).toBe('₹400.00')
    expect(formatPaise(12345600)).toBe('₹1,23,456.00')
  })
})

describe('allExpensesTimeline', () => {
  it('holds only what involves you, across every Group', () => {
    const seed = createSeedData()
    const items = allExpensesTimeline(seed).flatMap((m) => m.items)
    const names = items.filter((i) => i.kind === 'expense').map((i) => i.record.description)
    expect(names).toContain('Vikram’s internet bill') // you paid, no Share of your own
    expect(names).toContain('Biryani Friday')
    expect(names).not.toContain('Parasailing at Baga')
    expect(names).not.toContain('Scooter rental')
    for (const item of items) {
      if (item.kind === 'settlement') expect([item.record.fromId, item.record.toId]).toContain(CURRENT_USER_ID)
    }
    expect(new Set(items.map((i) => i.record.groupId))).toEqual(new Set(['g1', 'g2', 'g3']))
  })
})
