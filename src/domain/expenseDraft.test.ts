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
} from './expenseDraft'
import { paiseToInputText, parseRupees } from './money'
import type { Group } from './types'

const group: Group = { id: 'g', name: 'G', type: 'trip', memberIds: ['me', 'a', 'b'], formerMemberIds: [] }
const today = '2026-10-01'

const draft = (overrides: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
  groupId: 'g',
  description: 'Chai',
  amountText: '100',
  categoryId: 'general',
  date: today,
  notes: '',
  payerId: 'me',
  involvedIds: ['me', 'a', 'b'],
  splitMethod: 'equal',
  splitIds: ['me', 'a', 'b'],
  exactTexts: {},
  ...overrides,
})

describe('parseRupees', () => {
  it('reads rupees into exact paise', () => {
    expect(parseRupees('100')).toBe(10000)
    expect(parseRupees('4,275.5')).toBe(427550)
    expect(parseRupees('0.10')).toBe(10)
    expect(parseRupees(' 99.99 ')).toBe(9999)
  })

  it('rejects anything that is not a plain amount with at most two decimals', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1e3', '₹10']) expect(parseRupees(bad)).toBeNull()
  })
})

describe('draftShares', () => {
  it('splits ₹100.00 among 3 in member order, the extra paisa going first', () => {
    expect(draftShares(draft({ splitIds: ['b', 'a', 'me'] }), group)).toEqual([
      { personId: 'me', amount: 3334 },
      { personId: 'a', amount: 3333 },
      { personId: 'b', amount: 3333 },
    ])
  })

  it('leaves out people unticked from the split', () => {
    expect(draftShares(draft({ splitIds: ['a', 'b'] }), group).map((s) => s.personId)).toEqual(['a', 'b'])
  })
})

describe('canSaveDraft', () => {
  it('accepts a complete draft', () => {
    expect(canSaveDraft(draft(), group, today)).toBe(true)
  })

  it.each([
    ['no Description', { description: '  ' }],
    ['no Amount', { amountText: '' }],
    ['a zero Amount', { amountText: '0' }],
    ['an unreadable Amount', { amountText: '12.345' }],
    ['a future date', { date: '2026-10-02' }],
    ['no Payer', { payerId: null }],
    ['a Payer who is not ticked', { payerId: 'a', involvedIds: ['me', 'b'] }],
    ['only the Payer sharing', { splitIds: ['me'] }],
  ])('rejects %s', (_, overrides) => {
    expect(canSaveDraft(draft(overrides), group, today)).toBe(false)
  })

  it('allows the Payer to have no Share while others still share', () => {
    expect(canSaveDraft(draft({ splitIds: ['a', 'b'] }), group, today)).toBe(true)
  })
})

describe('expenseFromDraft', () => {
  it('builds an equal-split Expense with trimmed text and its Shares in paise', () => {
    expect(expenseFromDraft(draft({ description: ' Chai ', notes: ' ' }), group)).toEqual({
      groupId: 'g',
      description: 'Chai',
      amount: 10000,
      payerId: 'me',
      shares: [
        { personId: 'me', amount: 3334 },
        { personId: 'a', amount: 3333 },
        { personId: 'b', amount: 3333 },
      ],
      splitMethod: 'equal',
      categoryId: 'general',
      date: today,
    })
  })
})

describe('Exact split', () => {
  const exact = (exactTexts: Record<string, string>, overrides: Partial<ExpenseDraft> = {}) =>
    draft({ splitMethod: 'exact', amountText: '900', exactTexts, ...overrides })

  it('uses each typed amount as a Share, in member order', () => {
    expect(draftShares(exact({ b: '400', me: '200', a: '300' }), group)).toEqual([
      { personId: 'me', amount: 20000 },
      { personId: 'a', amount: 30000 },
      { personId: 'b', amount: 40000 },
    ])
  })

  it('reports what is left to assign, or how much too much is entered', () => {
    expect(leftToAssign(exact({ me: '200', a: '300' }), group)).toBe(40000)
    expect(leftToAssignText(40000)).toBe('₹400.00 left to assign')
    expect(leftToAssign(exact({ me: '500', a: '500' }), group)).toBe(-10000)
    expect(leftToAssignText(-10000)).toBe('₹100.00 more than the total')
  })

  it('can only be saved once nothing is left to assign and every entry is readable', () => {
    expect(canSaveDraft(exact({ me: '200', a: '300', b: '400' }), group, today)).toBe(true)
    expect(canSaveDraft(exact({ me: '200', a: '300' }), group, today)).toBe(false)
    expect(canSaveDraft(exact({ me: '200', a: '300', b: '500' }), group, today)).toBe(false)
    expect(canSaveDraft(exact({ me: '200', a: '300', b: '4oo' }), group, today)).toBe(false)
  })

  it('never saves ₹0.00 as a Share', () => {
    const d = exact({ me: '0', a: '900', b: '' })
    expect(draftShares(d, group)).toEqual([{ personId: 'a', amount: 90000 }])
    expect(expenseFromDraft(d, group).shares).toEqual([{ personId: 'a', amount: 90000 }])
  })

  it('lets the Payer have no Share, e.g. paying a flatmate’s bill', () => {
    const d = exact({ a: '900' }, { payerId: 'me' })
    expect(canSaveDraft(d, group, today)).toBe(true)
    expect(expenseFromDraft(d, group)).toMatchObject({ payerId: 'me', splitMethod: 'exact', shares: [{ personId: 'a', amount: 90000 }] })
  })

  it('needs at least one person other than the Payer with a Share above ₹0.00', () => {
    const onlyPayer = exact({ me: '900', a: '0' })
    expect(hasOtherSharer(onlyPayer, group)).toBe(false)
    expect(canSaveDraft(onlyPayer, group, today)).toBe(false)
  })

  it('starts from the current equal Shares when switched on', () => {
    const switched = switchToExact(draft({ amountText: '100' }), group)
    expect(switched.exactTexts).toEqual({ me: '33.34', a: '33.33', b: '33.33' })
    expect(leftToAssign(switched, group)).toBe(0)
  })
})

describe('equal split edge cases', () => {
  it('treats a ₹0.00 equal Share as no Share', () => {
    expect(draftShares(draft({ amountText: '0.02' }), group)).toEqual([
      { personId: 'me', amount: 1 },
      { personId: 'a', amount: 1 },
    ])
  })
})

describe('paiseToInputText', () => {
  it('formats without floating point', () => {
    expect(paiseToInputText(3334)).toBe('33.34')
    expect(paiseToInputText(5)).toBe('0.05')
    expect(paiseToInputText(90000)).toBe('900.00')
  })
})

describe('todayIso', () => {
  it('uses the local calendar date', () => {
    expect(todayIso(new Date(2026, 9, 1, 23, 30))).toBe('2026-10-01')
  })
})

describe('draftFromExpense', () => {
  it('round-trips an equal-split Expense', () => {
    const original = expenseFromDraft(draft({ amountText: '100', splitIds: ['a', 'b'], notes: 'n' }), group)
    const back = draftFromExpense({ ...original, id: 'x', createdAt: 't' })
    expect(back).toMatchObject({ amountText: '100.00', payerId: 'me', involvedIds: ['me', 'a', 'b'], splitIds: ['a', 'b'], notes: 'n' })
    expect(expenseFromDraft(back, group)).toEqual(original)
  })

  it('round-trips an Exact Expense whose Payer has no Share', () => {
    const original = expenseFromDraft(
      draft({ splitMethod: 'exact', amountText: '1179', exactTexts: { b: '1179' } }),
      group,
    )
    const back = draftFromExpense({ ...original, id: 'x', createdAt: 't' })
    expect(back).toMatchObject({ splitMethod: 'exact', involvedIds: ['me', 'b'], exactTexts: { b: '1179.00' } })
    expect(canSaveDraft(back, group, today)).toBe(true)
    expect(expenseFromDraft(back, group)).toEqual(original)
  })
})
