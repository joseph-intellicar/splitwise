/** Whole paise (₹12.50 is 1250); see ADR-0001. */
export type Paise = number

/** Calendar date as YYYY-MM-DD. */
export type IsoDate = string

export const CURRENT_USER_ID = 'me'

export type PersonId = string

export interface CurrentUser {
  id: typeof CURRENT_USER_ID
  name: string
}

export interface Friend {
  id: PersonId
  name: string
  email?: string
  phone?: string
}

export type GroupType = 'trip' | 'home' | 'couple' | 'other'

export interface Group {
  id: string
  name: string
  type: GroupType
  /** Current members: the Current User first, then in the order added. */
  memberIds: PersonId[]
  formerMemberIds: PersonId[]
}

export interface Share {
  personId: PersonId
  amount: Paise
}

export type SplitMethod = 'equal' | 'exact'

export interface Expense {
  id: string
  groupId: string
  description: string
  amount: Paise
  payerId: PersonId
  /** Final Shares, each greater than zero, summing to `amount`. */
  shares: Share[]
  splitMethod: SplitMethod
  categoryId: string
  date: IsoDate
  notes?: string
  /** When the record was added; orders items that share a date. */
  createdAt: string
}

export interface Settlement {
  id: string
  groupId: string
  fromId: PersonId
  toId: PersonId
  amount: Paise
  date: IsoDate
  createdAt: string
}

/** Every record the app keeps. Balances are never stored; they are derived. */
export interface AppData {
  currentUser: CurrentUser
  friends: Friend[]
  groups: Group[]
  expenses: Expense[]
  settlements: Settlement[]
}
