import type { AppData, PersonId } from './types'
import { CURRENT_USER_ID } from './types'

/** Full name; the Current User's own name. */
export function personName(data: AppData, personId: PersonId): string {
  if (personId === CURRENT_USER_ID) return data.currentUser.name
  return data.friends.find((f) => f.id === personId)?.name ?? 'Unknown'
}

/** How a person is named in sentences: "You" for the Current User, otherwise their first name. */
export function shortName(data: AppData, personId: PersonId): string {
  if (personId === CURRENT_USER_ID) return 'You'
  return personName(data, personId).split(' ')[0]
}
