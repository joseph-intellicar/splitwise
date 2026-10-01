export interface Category {
  id: string
  label: string
}

export const DEFAULT_CATEGORY_ID = 'general'

export const CATEGORIES: Category[] = [
  { id: 'general', label: 'General' },
  { id: 'dining', label: 'Dining out' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'taxi', label: 'Taxi' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'transport', label: 'Transport' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'activities', label: 'Activities' },
  { id: 'rent', label: 'Rent' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'internet', label: 'Internet' },
]

export function categoryLabel(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? 'General'
}
