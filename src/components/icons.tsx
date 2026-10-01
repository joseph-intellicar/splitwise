import {
  BedDouble,
  Car,
  Fuel,
  Heart,
  Home,
  KeyRound,
  Martini,
  Mountain,
  Plane,
  Receipt,
  ShoppingBasket,
  TrainFront,
  Users,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { categoryLabel } from '@/domain/categories'
import type { GroupType } from '@/domain/types'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  general: Receipt,
  dining: Utensils,
  groceries: ShoppingBasket,
  drinks: Martini,
  taxi: Car,
  fuel: Fuel,
  transport: TrainFront,
  hotel: BedDouble,
  activities: Mountain,
  rent: KeyRound,
  electricity: Zap,
  internet: Wifi,
}

export function CategoryIcon({ categoryId, className }: { categoryId: string; className?: string }) {
  const Icon = CATEGORY_ICONS[categoryId] ?? Receipt
  return (
    <span
      className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground', className)}
      title={categoryLabel(categoryId)}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

const GROUP_TYPE_ICONS: Record<GroupType, LucideIcon> = {
  trip: Plane,
  home: Home,
  couple: Heart,
  other: Users,
}

export function GroupTypeIcon({ type, className }: { type: GroupType; className?: string }) {
  const Icon = GROUP_TYPE_ICONS[type]
  return (
    <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary', className)}>
      <Icon className="size-6" aria-hidden="true" />
    </span>
  )
}
