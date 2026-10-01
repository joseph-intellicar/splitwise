import { splitEqually } from './split'
import type { AppData, Expense, IsoDate, Paise, PersonId, Settlement } from './types'
import { CURRENT_USER_ID as ME } from './types'

/**
 * Version of the saved data (the Seed Data and the record shape). Bump it
 * whenever either changes: saved data with another version is not loaded,
 * and the app starts from the current Seed Data instead.
 */
export const DATA_VERSION = 1

const rupees = (r: number): Paise => Math.round(r * 100)

// Friends
const PRIYA = 'f1'
const ARJUN = 'f2'
const ROHAN = 'f3'
const SNEHA = 'f4'
const KABIR = 'f5' // Former Member of Goa Trip
const ANANYA = 'f6'
const VIKRAM = 'f7'
const MEERA = 'f8'
const RAHUL = 'f9'
const NIKHIL = 'f10' // shares no Group

// Groups
const GOA = 'g1'
const FLAT = 'g2'
const OFFICE = 'g3'

/** Builds the fixed Seed Data. Every call returns a fresh, identical copy. */
export function createSeedData(): AppData {
  let seq = 0
  const createdAt = (date: IsoDate) => {
    seq += 1
    // Fixed timestamps on the item's own date, in insertion order.
    return `${date}T10:${String(Math.floor(seq / 60)).padStart(2, '0')}:${String(seq % 60).padStart(2, '0')}.000Z`
  }

  const expenses: Expense[] = []
  const settlements: Settlement[] = []

  const equal = (
    groupId: string,
    date: IsoDate,
    description: string,
    categoryId: string,
    amount: Paise,
    payerId: PersonId,
    sharerIds: PersonId[],
    notes?: string,
  ) => {
    expenses.push({
      id: `e${expenses.length + 1}`,
      groupId,
      description,
      amount,
      payerId,
      shares: splitEqually(amount, sharerIds),
      splitMethod: 'equal',
      categoryId,
      date,
      notes,
      createdAt: createdAt(date),
    })
  }

  const exact = (
    groupId: string,
    date: IsoDate,
    description: string,
    categoryId: string,
    payerId: PersonId,
    shares: [PersonId, Paise][],
    notes?: string,
  ) => {
    expenses.push({
      id: `e${expenses.length + 1}`,
      groupId,
      description,
      amount: shares.reduce((sum, [, amount]) => sum + amount, 0),
      payerId,
      shares: shares.map(([personId, amount]) => ({ personId, amount })),
      splitMethod: 'exact',
      categoryId,
      date,
      notes,
      createdAt: createdAt(date),
    })
  }

  const settle = (groupId: string, date: IsoDate, fromId: PersonId, toId: PersonId, amount: Paise) => {
    settlements.push({
      id: `s${settlements.length + 1}`,
      groupId,
      fromId,
      toId,
      amount,
      date,
      createdAt: createdAt(date),
    })
  }

  // Goa Trip: partly settled. Kabir left after settling everything he owed or
  // was owed, so the Expenses he's on are locked.
  const goaAll = [ME, PRIYA, ARJUN, ROHAN, SNEHA]
  exact(GOA, '2026-05-08', 'Villa in Assagao (6 nights)', 'hotel', ME, [
    [ME, rupees(6000)],
    [PRIYA, rupees(6000)],
    [ARJUN, rupees(4000)],
    [ROHAN, rupees(4000)],
    [SNEHA, rupees(4000)],
  ], 'Arjun, Rohan and Sneha arrived a night later.')
  equal(GOA, '2026-05-08', 'Beach shack dinner', 'dining', rupees(3600), ME, [ME, PRIYA, ARJUN, KABIR])
  equal(GOA, '2026-05-09', 'Scooter rental', 'transport', rupees(1800), KABIR, [PRIYA, ARJUN, KABIR])
  equal(GOA, '2026-05-09', 'Seafood at Britto’s', 'dining', rupees(4275.5), PRIYA, goaAll)
  equal(GOA, '2026-05-10', 'Groceries for the villa', 'groceries', rupees(1999), SNEHA, goaAll)
  equal(GOA, '2026-05-10', 'Fuel for the scooters', 'fuel', rupees(1000), ARJUN, goaAll)
  equal(GOA, '2026-05-11', 'Parasailing at Baga', 'activities', rupees(6000), ROHAN, [ROHAN, SNEHA])
  equal(GOA, '2026-05-12', 'Dudhsagar falls day trip', 'activities', rupees(5000), ME, [ME, ROHAN, SNEHA])
  exact(GOA, '2026-05-13', 'Drinks at Tito’s', 'drinks', ARJUN, [
    [PRIYA, rupees(800)],
    [ARJUN, rupees(800)],
    [ROHAN, rupees(1600)],
  ])
  equal(GOA, '2026-05-14', 'Airport cab back', 'taxi', rupees(2450), PRIYA, goaAll)
  settle(GOA, '2026-05-15', KABIR, ME, rupees(900))
  settle(GOA, '2026-05-15', PRIYA, KABIR, rupees(600))
  settle(GOA, '2026-05-15', ARJUN, KABIR, rupees(600))
  settle(GOA, '2026-05-20', ARJUN, ME, rupees(2000))
  settle(GOA, '2026-05-20', SNEHA, ROHAN, rupees(3000))

  // Flat 4B: monthly rent, electricity and groceries.
  const flatAll = [ME, ANANYA, VIKRAM]
  const electricity = [2140.75, 2390.4, 2875.2, 3010.6, 2655.35, 2210.9]
  const groceries = [3412, 2988.5, 3650, 3120.75, 2845, 3299]
  ;['04', '05', '06', '07', '08', '09'].forEach((month, i) => {
    equal(FLAT, `2026-${month}-01`, 'Rent', 'rent', rupees(36000), ME, flatAll)
    equal(FLAT, `2026-${month}-06`, 'Electricity bill', 'electricity', rupees(electricity[i]), VIKRAM, flatAll)
    equal(FLAT, `2026-${month}-14`, 'Monthly groceries', 'groceries', rupees(groceries[i]), ANANYA, flatAll)
    // Rent and bills are settled up to August; September is still open.
    if (month !== '09') {
      settle(FLAT, `2026-${month}-25`, ANANYA, ME, rupees(12000))
      settle(FLAT, `2026-${month}-25`, VIKRAM, ME, rupees(12000))
    }
  })
  // The Payer has no Share: Joseph covered Vikram's own internet bill.
  exact(FLAT, '2026-09-10', 'Vikram’s internet bill', 'internet', ME, [[VIKRAM, rupees(1179)]],
    'Paid it while Vikram was travelling.')

  // Office Lunch: every Debt settled.
  equal(OFFICE, '2026-07-10', 'Biryani Friday', 'dining', rupees(1640), MEERA, [ME, PRIYA, MEERA, RAHUL])
  equal(OFFICE, '2026-07-24', 'Team lunch at Truffles', 'dining', rupees(2380), ME, [ME, PRIYA, MEERA, RAHUL])
  equal(OFFICE, '2026-08-05', 'Chaat run', 'dining', rupees(420), RAHUL, [ME, MEERA, RAHUL])
  settle(OFFICE, '2026-08-07', MEERA, ME, rupees(185))
  settle(OFFICE, '2026-08-07', PRIYA, ME, rupees(595))
  settle(OFFICE, '2026-08-07', RAHUL, ME, rupees(455))
  settle(OFFICE, '2026-08-07', PRIYA, MEERA, rupees(410))
  settle(OFFICE, '2026-08-07', RAHUL, MEERA, rupees(270))

  return {
    currentUser: { id: ME, name: 'Joseph' },
    friends: [
      { id: PRIYA, name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98450 12345' },
      { id: ARJUN, name: 'Arjun Mehta', email: 'arjun.mehta@example.com' },
      { id: ROHAN, name: 'Rohan Iyer', email: 'rohan.iyer@example.com' },
      { id: SNEHA, name: 'Sneha Reddy', phone: '+91 99000 45678' },
      { id: KABIR, name: 'Kabir Malhotra', email: 'kabir.malhotra@example.com' },
      { id: ANANYA, name: 'Ananya Nair', email: 'ananya.nair@example.com', phone: '+91 97400 23456' },
      { id: VIKRAM, name: 'Vikram Singh', email: 'vikram.singh@example.com' },
      { id: MEERA, name: 'Meera Pillai', email: 'meera.pillai@example.com' },
      { id: RAHUL, name: 'Rahul Verma', phone: '+91 98860 34567' },
      { id: NIKHIL, name: 'Nikhil Joshi', email: 'nikhil.joshi@example.com' },
    ],
    groups: [
      { id: GOA, name: 'Goa Trip', type: 'trip', memberIds: goaAll, formerMemberIds: [KABIR] },
      { id: FLAT, name: 'Flat 4B', type: 'home', memberIds: flatAll, formerMemberIds: [] },
      { id: OFFICE, name: 'Office Lunch', type: 'other', memberIds: [ME, PRIYA, MEERA, RAHUL], formerMemberIds: [] },
    ],
    expenses,
    settlements,
  }
}
